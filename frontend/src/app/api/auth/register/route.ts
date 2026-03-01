import { NextResponse } from 'next/server';
import { registerUser } from '@/actions/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = await registerUser(body);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        if (result.needsVerification) {
            return NextResponse.json({ success: true, needsVerification: true, user: result.user }, { status: 201 });
        }

        return NextResponse.json({ success: true, user: result.user }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
