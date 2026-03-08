import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth-util';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const userPayload = await getUserFromCookies();
        if (!userPayload || (userPayload.role !== 'HR_USER' && userPayload.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
        }

        const job = await db.job.findUnique({
            where: { id },
            include: { company: true }
        });

        if (!job) {
            return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
        }

        const applications = await db.application.findMany({
            where: { jobId: id },
            include: {
                applicant: {
                    select: {
                        name: true,
                        email: true,
                        id: true,
                        profile: {
                            include: { certificates: true }
                        }
                    }
                }
            },
            orderBy: { finalScore: 'desc' }
        });

        return NextResponse.json({ success: true, job, applications });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
