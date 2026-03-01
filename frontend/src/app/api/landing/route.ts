import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const companyCount = await db.company.count({ where: { isVerified: true } });
        const companies = await db.company.findMany({
            where: { isVerified: true },
            take: 5,
            select: { name: true },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json({ success: true, count: companyCount, companies });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
