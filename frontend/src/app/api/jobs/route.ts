import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth-util';

export async function GET(req: Request) {
    try {
        const userPayload = await getUserFromCookies();
        const user = userPayload ? await db.user.findUnique({ where: { id: userPayload.userId as string } }) : null;

        let jobs = [];
        if (userPayload?.role === 'HR_USER' || userPayload?.role === 'ADMIN') {
            const condition = userPayload.role === 'HR_USER' ? { companyId: user?.companyId as string } : {};
            jobs = await db.job.findMany({
                where: condition,
                include: { company: true },
                orderBy: { createdAt: 'desc' },
            });
        } else {
            jobs = await db.job.findMany({
                include: { company: true },
                orderBy: { createdAt: 'desc' },
            });
        }

        return NextResponse.json({ success: true, jobs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch jobs' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userPayload = await getUserFromCookies();
        if (!userPayload || (userPayload.role !== 'HR_USER' && userPayload.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized. Only HR/Admin can post jobs.' }, { status: 403 });
        }

        const user = await db.user.findUnique({ where: { id: userPayload.userId as string } });
        if (!user?.companyId) {
            return NextResponse.json({ error: 'HR account must be linked to a company to post jobs.' }, { status: 400 });
        }

        const body = await req.json();
        const { title, description, industry, vacancyCount, requirements, preferred, experienceLevel, salaryRange } = body;

        if (!title || !description || !industry) {
            return NextResponse.json({ error: 'Title, description, and industry are required.' }, { status: 400 });
        }

        const newJob = await db.job.create({
            data: {
                title,
                description,
                industry,
                vacancyCount: vacancyCount || 1,
                requirements,
                preferred,
                experienceLevel,
                salaryRange,
                companyId: user.companyId,
            }
        });

        return NextResponse.json({ success: true, job: newJob }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to create job' }, { status: 500 });
    }
}
