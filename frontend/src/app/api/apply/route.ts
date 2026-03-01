import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth-util';
import path from 'path';

export async function POST(req: Request) {
    try {
        const userPayload = await getUserFromCookies();
        if (!userPayload || userPayload.role !== 'CANDIDATE') {
            return NextResponse.json({ error: 'Unauthorized or not a Candidate' }, { status: 403 });
        }

        const body = await req.json();
        const { jobId } = body;

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required.' }, { status: 400 });
        }

        // 1. Fetch User Profile & Job Data
        const userRecord = await db.user.findUnique({
            where: { id: userPayload.userId as string },
            include: { profile: true }
        });

        const job = await db.job.findUnique({
            where: { id: jobId }
        });

        if (!userRecord?.profile?.resumeUrl) {
            return NextResponse.json({ error: 'You must upload a resume to your profile before applying.' }, { status: 400 });
        }

        if (!job) {
            return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
        }

        const resumeAbsolutePath = path.join(process.cwd(), 'public', userRecord.profile.resumeUrl);

        // 2. ML Scoring (Domain Independent + Certificate logic)
        let scoring = {
            matchScore: 0.0,
            certificateScore: 0.0,
            linkScore: 0.0,
            finalScore: 0.0,
            skillGap: ""
        };

        try {
            const mlFormData = new FormData();
            mlFormData.append("resume_path", resumeAbsolutePath);
            mlFormData.append("job_requirements", job.requirements || job.description);
            mlFormData.append("experience_level", job.experienceLevel || "");

            const mlResponse = await fetch("http://127.0.0.1:8000/api/score", {
                method: "POST",
                body: mlFormData
            });

            if (mlResponse.ok) {
                const mlData = await mlResponse.json();
                scoring = {
                    matchScore: mlData.matchScore,
                    certificateScore: mlData.certificateScore,
                    linkScore: mlData.linkScore,
                    finalScore: mlData.finalScore,
                    skillGap: JSON.stringify(mlData.skillGap || []) // Skill gap analysis
                };
            }
        } catch (mlErr) {
            console.error("ML service unreachable. Using empty scores.");
        }

        // 3. Create Application
        await db.application.create({
            data: {
                jobId,
                applicantId: userPayload.userId as string,
                ...scoring,
                status: "PENDING"
            }
        });

        // 4. Intelligent Ranking Logic (Top N shortlisting)
        const apps = await db.application.findMany({
            where: { jobId },
            orderBy: { finalScore: 'desc' }
        });

        const N = job.vacancyCount;

        // Reset recommendations and set top N
        for (let i = 0; i < apps.length; i++) {
            await db.application.update({
                where: { id: apps[i].id },
                data: { isRecommended: i < N }
            });
        }

        return NextResponse.json({ success: true, isRecommended: apps.findIndex(a => a.applicantId === userPayload.userId) < N });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to apply' }, { status: 500 });
    }
}
