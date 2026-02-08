
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const workspaceId = id;

    try {
        const workspace = await db.workspace.findUnique({
            where: { id: workspaceId },
            select: { id: true, filename: true, moduleCount: true }
        });

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        const modules = await db.module.findMany({
            where: { workspaceId },
            orderBy: { index: 'asc' }
        });

        return NextResponse.json({ workspace, modules });
    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
