import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const headersList = await headers();
        const userId = headersList.get('x-user-id');

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const plan = await prisma.studyPlan.findUnique({
            where: { id },
            select: { userId: true }
        });

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        if (plan.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.studyPlan.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Delete plan error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
