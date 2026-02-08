
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // This is module ID
) {
    const { id } = await params;
    const moduleId = id;

    try {
        const module = await db.module.findUnique({
            where: { id: moduleId },
            include: {
                workspace: {
                    select: {
                        id: true,
                        filename: true,
                    }
                },
                quizzes: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        attempts: {
                            orderBy: { completedAt: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });

        if (!module) {
            return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }

        return NextResponse.json(module);
    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
