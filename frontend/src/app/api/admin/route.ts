import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth-util';

export async function GET(req: Request) {
    try {
        const userPayload = await getUserFromCookies();
        if (!userPayload || userPayload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        // Fetch all users
        const users = await db.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch all jobs
        const jobs = await db.job.findMany({
            include: {
                company: true,
                applications: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch all companies
        const companies = await db.company.findMany({
            orderBy: { createdAt: 'desc' }
        });

        const uptimeSeconds = process.uptime();
        const uptimeHours = Math.floor(uptimeSeconds / 3600);
        const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
        const uptimeStr = uptimeHours > 0 ? `${uptimeHours}h ${uptimeMinutes}m` : `${uptimeMinutes}m ${Math.floor(uptimeSeconds % 60)}s`;

        // Overview Stats
        const stats = {
            totalUsers: users.length,
            totalJobSeekers: users.filter((u: any) => u.role === 'CANDIDATE').length,
            totalHR: users.filter((u: any) => u.role === 'HR_USER').length,
            totalJobs: jobs.length,
            totalCompanies: companies.length,
            totalApplications: jobs.reduce((acc: number, job: any) => acc + job.applications.length, 0),
            systemUptime: uptimeStr
        };

        return NextResponse.json({ success: true, users, jobs, companies, stats });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch admin data' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userPayload = await getUserFromCookies();
        if (!userPayload || userPayload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { companyId, isVerified } = await req.json();

        const updated = await db.company.update({
            where: { id: companyId },
            data: { isVerified }
        });

        return NextResponse.json({ success: true, company: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
