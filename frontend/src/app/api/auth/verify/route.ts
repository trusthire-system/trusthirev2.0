import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Missing verification token.' }, { status: 400 });
    }

    try {
        const user = await db.user.findFirst({
            where: { verificationTok: token }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 404 });
        }

        if (user.isVerified) {
            return NextResponse.redirect(new URL('/login?message=Account already verified', req.url));
        }

        await db.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationTok: null // Clear token after use
            }
        });

        return NextResponse.redirect(new URL('/login?message=Account verified successfully! You can now log in.', req.url));
    } catch (error: any) {
        return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
    }
}
