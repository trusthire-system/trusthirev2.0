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
            data: { status },
            include: { job: true } // Include job to get its title
        });

        // Generate a notification for the candidate
        let notifText = `Your application status for ${application.job.title} was updated to ${status}.`;
        let notifType = 'info';

        if (status === 'SELECTED') {
            notifText = `Congratulations! You have been SELECTED for the ${application.job.title} role!`;
            notifType = 'success';
        } else if (status === 'REJECTED') {
            notifText = `Unfortunately, your application for ${application.job.title} was not selected.`;
            notifType = 'error';
        }

        await db.notification.create({
            data: {
                userId: application.applicantId,
                text: notifText,
                type: notifType
            }
        });


        return NextResponse.json({ success: true, application });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
