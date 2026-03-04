import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth-util';

export async function GET() {
    try {
        const userPayload = await getUserFromCookies();
        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const notifications = await db.notification.findMany({
            where: {
                userId: userPayload.userId,
                isRead: false
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Format dates relative if desired, for now we just map them simply
        const formattedNotifs = notifications.map((n: any) => ({
            id: n.id,
            text: n.text,
            type: n.type,
            time: new Date(n.createdAt).toLocaleDateString() + ' ' + new Date(n.createdAt).toLocaleTimeString()
        }));

        return NextResponse.json({ notifications: formattedNotifs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT() {
    // Mark all as read
    try {
        const userPayload = await getUserFromCookies();
        if (!userPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await db.notification.updateMany({
            where: { userId: userPayload.userId, isRead: false },
            data: { isRead: true }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
