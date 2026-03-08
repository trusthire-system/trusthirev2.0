import { db } from '../lib/db';
import logger from '../lib/logger';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import nodemailer from 'nodemailer';

// Dynamic email sending feature
async function sendVerificationEmail(toEmail: string, token: string) {
    // Falls back to a testing/dummy mechanism if you haven't set up SMTP yet
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'your-email@gmail.com',
            pass: process.env.EMAIL_PASS || 'your-app-password'
        }
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/verify?token=${token}`;

    try {
        await transporter.sendMail({
            from: '"TrustHire Governance" <no-reply@trusthire.com>',
            to: toEmail,
            subject: "Verify Your TrustHire Platform Account",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #0b0c10;">Welcome to TrustHire</h2>
                    <p style="color: #45a29e; font-size: 16px;">We are excited to have you on board! Please click the button below to verify your account:</p>
                    <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #66fcf1; color: #0b0c10; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px;">Verify My Account</a>
                    <p style="color: #c5c6c7; font-size: 12px; margin-top: 30px;">If you did not create this account, please ignore this email.</p>
                </div>
            `
        });
        logger.info(`[VERIFICATION] Network transmission to ${toEmail} queued.`);
    } catch (err: any) {
        logger.error(`Mail Error: ${err.message}`, { err });
        throw new Error("Failed to send verification email. Please check the email address and network.");
    }
}

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'super-secret-trusthire-key-changeme-in-prod'
);

export async function createAuthToken(userId: string, role: string) {
    const token = await new SignJWT({ userId, role })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(JWT_SECRET);
    return token;
}

import { v4 as uuidv4 } from 'uuid';

export async function registerUser(data: any) {
    logger.info(`Starting registration process for email: ${data.email}, role: ${data.role}`);
    const { name, email, password, role, companyName, industry } = data;

    if (!name || !email || !password || !role) {
        logger.warn(`Registration failed. Missing required fields for email: ${data.email}`);
        return { error: 'Required fields missing.' };
    }

    // Role mapping
    const userRole = (role === 'HR' || role === 'HR_USER') ? 'HR_USER' : 'CANDIDATE';

    // 1. HR Verification Logic: Block public email providers
    if (userRole === 'HR_USER') {
        const publicDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
        const domain = email.split('@')[1]?.toLowerCase();

        if (!domain || publicDomains.includes(domain)) {
            logger.warn(`Registration blocked for HR_USER using public domain email: ${email}`);
            return { error: 'HR registration requires a valid organizational email. Public providers are blocked.' };
        }

        if (!companyName || !industry) {
            logger.warn(`Registration failed. Missing company details for HR_USER: ${email}`);
            return { error: 'Company details are required for HR registration.' };
        }
    }

    try {
        const existingUser = await db.user.findUnique({ where: { email } });
        if (existingUser) {
            logger.warn(`Registration failed. User with this email already exists: ${email}`);
            return { error: 'User with this email already exists.' };
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const verificationToken = uuidv4();

        // 2. Create User (Pending Verification)
        const newUser = await db.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: userRole,
                isVerified: false,
                verificationTok: verificationToken
            }
        });
        logger.info(`User created successfully pending verification: ${newUser.id} (${newUser.email})`);

        // 3. Handle CANDIDATE: Create Profile
        if (userRole === 'CANDIDATE') {
            const profile = await db.profile.create({ data: {} });
            await db.user.update({
                where: { id: newUser.id },
                data: { profileId: profile.id }
            });
            logger.info(`Candidate profile created for user: ${newUser.id}`);
        }

        // 4. Handle HR: Create/Link Company
        if (userRole === 'HR_USER') {
            const company = await db.company.create({
                data: {
                    name: companyName,
                    industry: industry,
                    isVerified: false // Requires admin approval in new vision
                }
            });
            await db.user.update({
                where: { id: newUser.id },
                data: { companyId: company.id }
            });
            logger.info(`Company ${companyName} created and linked to HR user: ${newUser.id}`);
        }

        // Dynamic verification email transmission
        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (emailError: any) {
            // Rollback User and associated Profile/Company
            const userState = await db.user.findUnique({ where: { id: newUser.id }, select: { profileId: true, companyId: true } });
            if (userState) {
                await db.user.delete({ where: { id: newUser.id } });
                if (userState.profileId) {
                    await db.profile.delete({ where: { id: userState.profileId } });
                }
                if (userState.companyId) {
                    await db.company.delete({ where: { id: userState.companyId } });
                }
            }
            logger.warn(`Registration rolled back for ${email} due to email failure.`);
            return { error: 'Failed to send verification email. Registration was aborted. Please verify the email address.' };
        }

        return {
            success: true,
            needsVerification: true,
            user: { id: newUser.id, role: newUser.role, name: newUser.name }
        };

    } catch (error: any) {
        logger.error(`Error during registration for ${data.email}: ${error.message}`, { error });
        return { error: error.message || 'An error occurred during registration.' };
    }
}

export async function resendVerificationUser(data: { email: string }) {
    logger.info(`Resend verification attempt for email: ${data.email}`);
    const { email } = data;

    if (!email) {
        logger.warn('Resend verification failed. Email is required.');
        return { error: 'Email is required.' };
    }

    try {
        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
            logger.warn(`Resend verification failed. User not found for: ${email}`);
            return { error: 'User not found.' };
        }

        if (user.isVerified) {
            logger.info(`Resend verification ignored. User already verified: ${email}`);
            return { error: 'Account is already verified.' };
        }

        let token = user.verificationTok;
        if (!token) {
            token = uuidv4();
            await db.user.update({
                where: { email },
                data: { verificationTok: token }
            });
            logger.info(`Generated new verification token for user: ${email}`);
        }

        await sendVerificationEmail(email, token);
        logger.info(`Verification email resent to: ${email}`);
        return { success: true };
    } catch (error: any) {
        logger.error(`Error during resend verification for ${email}: ${error.message}`, { error });
        return { error: error.message || 'An error occurred while resending verification.' };
    }
}

export async function loginUser(data: any) {
    logger.info(`Login attempt for email: ${data.email}`);
    const { email, password } = data;

    if (!email || !password) {
        logger.warn(`Login failed. Email and password are required for: ${data.email}`);
        return { error: 'Email and password are required.' };
    }

    try {
        const user = await db.user.findUnique({
            where: { email },
            include: { company: true }
        });

        if (!user) {
            logger.warn(`Login failed. Invalid credentials (user not found) for: ${email}`);
            return { error: 'User not found.' };
        }

        // 1. Enforce Verification
        if (!user.isVerified) {
            logger.warn(`Login blocked. Account pending verification for: ${email}`);
            return { error: 'Your account is pending verification. Please check your email.' };
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            logger.warn(`Login failed. Invalid credentials (password mismatch) for: ${email}`);
            return { error: 'Incorrect password.' };
        }

        const token = await createAuthToken(user.id, user.role);
        logger.info(`User logged in successfully: ${user.id} (${user.email})`);
        return {
            success: true,
            token,
            user: {
                id: user.id,
                role: user.role,
                name: user.name,
                company: user.company // Include company for HR
            }
        };
    } catch (error: any) {
        logger.error(`Error during login for ${email}: ${error.message}`, { error });
        return { error: error.message || 'An error occurred during login.' };
    }
}
