import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const quiz = await db.quizDefinition.findUnique({
            where: { id },
            include: {
                attempts: {
                    orderBy: { completedAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

        return NextResponse.json(quiz);
    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
