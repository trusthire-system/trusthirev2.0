import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Verification token is missing.' }, { status: 400 });
        }

        const user = await db.user.findFirst({
            where: { verificationTok: token }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired verification token.' }, { status: 400 });
        }

        if (user.isVerified) {
            return NextResponse.json({ message: 'Account is already verified. You can log in.' }, { status: 200 });
        }

        await db.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationTok: null // Clear token after success
            }
        });

        // Redirect to login page with a success message
        return NextResponse.redirect(new URL('/login?verified=true', req.url));

    } catch (err) {
        console.error("Verification Error: ", err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
