import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth-util';

export async function GET() {
    const userPayload = await getUserFromCookies();
    if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = userPayload.userId as string;

    try {
        const userWithProfile = await db.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                applications: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        job: {
                            select: {
                                title: true,
                                company: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                }
            },
        });

        if (!userWithProfile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const profile = userWithProfile.profile;
        let identityStrength = 0;
        if (profile) {
            if (profile.education) identityStrength += 15;
            if (profile.experienceYears > 0) identityStrength += 20;
            if (profile.skills && profile.skills.length > 5) identityStrength += 25;
            if (profile.resumeUrl) identityStrength += 20;
            if (profile.phone) identityStrength += 10;
            if (profile.address) identityStrength += 10;
        }

        // --- DYNAMIC PROFILE ANALYZED RECOMMENDATIONS ---
        let recommendedJobs: any[] = [];
        if (profile && profile.skills) {
            const userSkills = profile.skills.toLowerCase().split(/[,\s]+/).map(s => s.trim()).filter(s => s.length > 2);
            const userEducation = (profile.education || "").toLowerCase();
            const userExp = profile.experienceYears || 0;
            const userAppliedJobIds = userWithProfile.applications.map(app => app.jobId);

            const availableJobs = await db.job.findMany({
                where: {
                    isActive: true,
                    id: { notIn: userAppliedJobIds }
                },
                include: {
                    company: {
                        select: { name: true, industry: true }
                    }
                }
            });

            const scoredJobs = availableJobs.map(job => {
                let score = 0;
                const jobReqs = (job.requirements || "").toLowerCase();
                const jobTitle = job.title.toLowerCase();
                const jobDesc = job.description.toLowerCase();
                const jobIndustry = (job.industry || "").toLowerCase();
                const jobExp = job.experienceLevel || "";

                // 1. Skill Matching (Highest Weight)
                userSkills.forEach(skill => {
                    if (jobReqs.includes(skill)) score += 25;
                    else if (jobDesc.includes(skill)) score += 10;

                    if (jobTitle.includes(skill)) score += 15;
                });

                // 2. Industry Context
                userSkills.forEach(skill => {
                    if (jobIndustry.includes(skill)) score += 10;
                });

                // 3. Experience Level Matching
                // Heuristic for entry-level vs senior
                const isSeniorJob = jobTitle.includes('senior') || jobTitle.includes('lead') || jobTitle.includes('sr') || jobExp.includes('5+');
                const isJuniorJob = jobTitle.includes('junior') || jobTitle.includes('entry') || jobTitle.includes('jr') || jobExp.includes('0-2');

                if (userExp >= 5 && isSeniorJob) score += 20;
                else if (userExp < 3 && isJuniorJob) score += 20;
                else if (userExp >= 3 && userExp < 5 && !isSeniorJob && !isJuniorJob) score += 20;

                // 4. Education Keywords
                if (userEducation.includes('b.s') && jobDesc.includes('bachelor')) score += 5;
                if (userEducation.includes('m.s') && jobDesc.includes('master')) score += 10;

                // Final Scoring
                const finalScore = Math.min(Math.round(score), 99);
                return {
                    id: job.id,
                    title: job.title,
                    companyName: job.company.name,
                    industry: job.company.industry,
                    matchScore: finalScore
                };
            });

            // Filter out zero matches and sort by score
            recommendedJobs = scoredJobs
                .filter(job => job.matchScore > 10)
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, 4);
        }

        return NextResponse.json({
            user: { name: userWithProfile.name, email: userWithProfile.email, role: userWithProfile.role },
            profile: userWithProfile.profile,
            applications: userWithProfile.applications,
            identityStrength,
            recommendedJobs
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Error fetching profile' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const userPayload = await getUserFromCookies();
    if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = userPayload.userId as string;

    try {
        const body = await req.json();
        const { skills, experienceYears, education, phone, address } = body;

        const userRecord = await db.user.findUnique({
            where: { id: userId },
        });

        if (!userRecord || !userRecord.profileId) {
            return NextResponse.json({ error: 'Profile not found or User is likely HR' }, { status: 404 });
        }

        const updatedProfile = await db.profile.update({
            where: { id: userRecord.profileId },
            data: {
                skills,
                experienceYears: Number(experienceYears) || 0,
                education,
                phone,
                address
            },
        });

        return NextResponse.json({ success: true, profile: updatedProfile });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Error updating profile' }, { status: 500 });
    }
}
