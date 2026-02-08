import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const workspaces = await db.workspace.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                filename: true,
                originalName: true,
                status: true,
                createdAt: true,
                moduleCount: true,
                processingStage: true
            }
        });

        return NextResponse.json(workspaces);
    } catch (error) {
        console.error('Error fetching workspaces:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
