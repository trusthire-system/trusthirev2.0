import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth-util';

export async function GET() {
    try {
        const userPayload = await getUserFromCookies();
        if (!userPayload || (userPayload.role !== 'HR_USER' && userPayload.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const userId = userPayload.userId as string;
        const user = await db.user.findUnique({ where: { id: userId } });

        if (!user?.companyId && userPayload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'HR account not linked to a company' }, { status: 400 });
        }

        // Define condition based on role 
        const jobFilter = userPayload.role === 'ADMIN' ? {} : { companyId: user?.companyId as string };
        const appFilter = userPayload.role === 'ADMIN' ? {} : { job: { companyId: user?.companyId as string } };

        // 1. Basic Stats
        const totalJobs = await db.job.count({ where: jobFilter });
        const totalApplications = await db.application.count({ where: appFilter });

        const applications = await db.application.findMany({
            where: appFilter,
            select: {
                finalScore: true,
                status: true,
                createdAt: true,
            }
        });

        const avgScore = applications.length > 0
            ? applications.reduce((acc: number, curr: any) => acc + (curr.finalScore || 0), 0) / applications.length
            : 0;

        const acceptedCount = applications.filter((a: any) => a.status === 'SELECTED' || a.status === 'ACCEPTED').length;

        // 2. Fit Distribution Distribution
        const matchDistribution = [
            { name: 'Strong Match (>70%)', value: applications.filter((a: any) => a.finalScore > 70).length },
            { name: 'Potential Match (40-70%)', value: applications.filter((a: any) => a.finalScore >= 40 && a.finalScore <= 70).length },
            { name: 'Development Needed (<40%)', value: applications.filter((a: any) => a.finalScore < 40).length },
        ];

        // 3. Application Trends (last 7 days)
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const trends = last7Days.map(date => ({
            date: date.split('-').slice(1).join('/'),
            count: applications.filter((a: any) => a.createdAt.toISOString().split('T')[0] === date).length
        }));

        // 4. Fetch Recent Jobs for Context
        const recentJobs = await db.job.findMany({
            where: jobFilter,
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                company: true,
                _count: {
                    select: { applications: true }
                }
            }
        });

        // 5. Campaigns Volume (Bar Chart)
        const campaignVolume = recentJobs.map(j => ({
            name: j.title.length > 15 ? j.title.substring(0, 15) + '...' : j.title,
            count: j._count.applications
        }));

        return NextResponse.json({
            success: true,
            stats: {
                totalJobs,
                totalApplications,
                avgScore: Math.round(avgScore),
                acceptedCount
            },
            charts: {
                matchDistribution,
                trends,
                campaignVolume
            },
            recentJobs
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to fetch HR stats' }, { status: 500 });
    }
}
