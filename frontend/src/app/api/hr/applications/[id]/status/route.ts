import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth-util';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const userPayload = await getUserFromCookies();
        if (!userPayload || (userPayload.role !== 'HR_USER' && userPayload.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { status } = await req.json();

        if (!['PENDING', 'SELECTED', 'REJECTED', 'ON_HOLD', 'ACCEPTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const application = await db.application.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ success: true, application });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
