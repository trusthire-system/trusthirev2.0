import { NextResponse } from 'next/server';
import { loginUser } from '@/actions/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = await loginUser(body);

        if (result.error) {
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
        }

        return NextResponse.json({ success: true, user: result.user }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
