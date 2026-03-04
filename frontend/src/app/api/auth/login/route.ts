import { NextResponse } from 'next/server';
import { loginUser } from '@/actions/auth';
import { cookies } from 'next/headers';
import logger from '@/lib/logger';

export async function POST(req: Request) {
    try {
        logger.info('Received POST request to /api/auth/login');
        const body = await req.json();
        const result = await loginUser(body);

        if (result.error) {
            logger.warn(`Login route returned error: ${result.error}`);
            return NextResponse.json({ error: result.error }, { status: 401 });
        }

        if (result.token) {
            const cookieStore = await cookies();
            cookieStore.set('token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 2, // 2 hours
                path: '/'
            });
            logger.info(`Session cookie set for user: ${result.user?.id}`);
        }

        logger.info(`Login successful for user: ${result.user?.id}`);
        return NextResponse.json({ success: true, user: result.user }, { status: 200 });
    } catch (err: any) {
        logger.error(`Internal server error in login route: ${err.message}`, { err });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
