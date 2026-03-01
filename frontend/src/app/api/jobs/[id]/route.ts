import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth-util';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const job = await db.job.findUnique({
            where: { id },
            include: {
                company: true,
                _count: {
                    select: { applications: true }
                }
            }
        });

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, job });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch job' }, { status: 500 });
    }
}
