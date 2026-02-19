import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET(req) {
    try {
        const headersList = await headers();
        const userId = headersList.get('x-user-id');

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const plans = await prisma.studyPlan.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(plans);
    } catch (error) {
        console.error('Fetch Plans Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
