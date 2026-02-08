
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const workspaceId = id;

    try {
        const quizzes = await db.quizDefinition.findMany({
            where: { workspaceId },
            include: {
                module: { select: { title: true, index: true } },
                attempts: true
            }
        });

        const exportData = quizzes.map(q => ({
            module: q.module.title,
            moduleIndex: q.module.index,
            createdAt: q.createdAt,
            totalQuestions: JSON.parse(q.questions).length,
            attempts: q.attempts.map(a => ({
                score: a.score,
                total: a.totalQuestions,
                date: a.completedAt
            }))
        }));

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename = "quiz_history.json"`,
            },
        });

    } catch (error) {
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
