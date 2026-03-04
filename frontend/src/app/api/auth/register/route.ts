import { NextResponse } from 'next/server';
import { registerUser } from '@/actions/auth';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';

export async function POST(req: Request) {
    try {
        logger.info('Received POST request to /api/auth/register');
        const body = await req.json();
        const result = await registerUser(body);

        if (result.error) {
            logger.warn(`Register route returned error: ${result.error}`);
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        logger.info(`Registration API response generation for user: ${result.user?.id}`);
        if (result.needsVerification) {
            return NextResponse.json({ success: true, needsVerification: true, user: result.user }, { status: 201 });
        }

        return NextResponse.json({ success: true, user: result.user }, { status: 201 });
    } catch (err: any) {
        logger.error(`Internal server error in register route: ${err.message}`, { err });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
