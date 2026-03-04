import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth-util';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import logger from '@/lib/logger';

export async function POST(req: Request) {
    try {
        logger.info('Received POST request to /api/upload');
        const userPayload = await getUserFromCookies();
        if (!userPayload || userPayload.role !== 'CANDIDATE') {
            logger.warn(`Upload attempt denied. User unauthorized or not a candidate. User info: ${JSON.stringify(userPayload)}`);
            return NextResponse.json({ error: 'Unauthorized or not a Candidate' }, { status: 403 });
        }

        const data = await req.formData();
        const file: File | null = data.get('resume') as unknown as File;

        if (!file) {
            logger.warn(`Upload failed. No file provided by user: ${userPayload.userId}`);
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        logger.info(`Processing file upload: ${file.name} for user: ${userPayload.userId}`);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save locally for development config
        const filename = `${userPayload.userId}-${file.name.replace(/\s+/g, '_')}`;
        const uploadDir = join(process.cwd(), 'public/uploads');
        const path = join(uploadDir, filename);

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        await writeFile(path, buffer);
        logger.info(`File successfully written to ${path}`);
        const resumeUrl = `/uploads/${filename}`;

        // Update profile in DB
        const user = await db.user.findUnique({ where: { id: userPayload.userId as string } });

        if (user?.profileId) {
            // Refactoring to keep mlData in scope
            let extractedData: any = {};
            try {
                const absolutePath = join(process.cwd(), 'public/uploads', filename);
                const mlFormData = new FormData();
                mlFormData.append("resume_path", absolutePath);

                logger.info(`Sending file to ML service at ${absolutePath}`);
                const mlRes = await fetch("http://127.0.0.1:8000/api/extract", {
                    method: "POST",
                    body: mlFormData
                });

                if (mlRes.ok) {
                    extractedData = await mlRes.json();
                    logger.info(`Successfully extracted data from ML service for user: ${user.id}`);
                } else {
                    logger.warn(`ML service returned status ${mlRes.status} for user: ${user.id}`);
                }
            } catch (e: any) {
                logger.error(`ML Extraction Error for user ${user.id}: ${e.message}`, { error: e });
            }

            const updatedProfile = await db.profile.update({
                where: { id: user.profileId },
                data: {
                    resumeUrl,
                    ocrRawText: extractedData.raw_text || "",
                    resumeLastUploadedAt: new Date(),
                    phone: extractedData.phone || null,
                    address: extractedData.address || null,
                    education: extractedData.education || null,
                    experienceYears: extractedData.experienceYears || 0,
                    // If the user has no skills yet, we populate with ML suggestions
                    ...(extractedData.suggested_skills ? { skills: extractedData.suggested_skills } : {})
                }
            });

            return NextResponse.json({
                success: true,
                resumeUrl,
                extractedData: {
                    phone: extractedData.phone,
                    address: extractedData.address,
                    education: extractedData.education,
                    experienceYears: extractedData.experienceYears,
                    skills: extractedData.suggested_skills,
                    resumeLastUploadedAt: updatedProfile.resumeLastUploadedAt
                }
            });
        }

        logger.info(`Upload process completed for user: ${userPayload.userId}`);
        return NextResponse.json({ success: true, resumeUrl });
    } catch (error: any) {
        logger.error(`Error uploading file: ${error.message}`, { error });
        return NextResponse.json({ error: error.message || 'Error uploading file' }, { status: 500 });
    }
}
