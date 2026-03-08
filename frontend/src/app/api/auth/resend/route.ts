import { NextResponse } from 'next/server';
import { resendVerificationUser } from '@/actions/auth';
import logger from '@/lib/logger';

export async function POST(req: Request) {
    try {
        logger.info('Received POST request to /api/auth/resend');
        const body = await req.json();
        const result = await resendVerificationUser(body);

        if (result.error) {
            logger.warn(`Resend verification route returned error: ${result.error}`);
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: any) {
        logger.error(`Internal server error in resend verification route: ${err.message}`, { err });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
