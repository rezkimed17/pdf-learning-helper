import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { saveFile, computeFileHash } from '@/lib/uploads';
import { jobManager } from '@/lib/jobs';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Save file locally
        const { filePath, filename, originalName } = await saveFile(file);

        // Compute hash
        const fileHash = await computeFileHash(filePath);

        // Check for existing workspace with same hash
        const existingWorkspace = await db.workspace.findUnique({
            where: { fileHash },
        });

        if (existingWorkspace) {
            // Update the existing workspace with the new file path (since the old one might be deleted)
            // and reset status to restart processing cleanly.
            const updatedWorkspace = await db.workspace.update({
                where: { id: existingWorkspace.id },
                data: {
                    filePath,
                    filename, // Update filename too as it includes timestamp
                    status: 'UPLOADED',
                    processingStage: 'Ready for processing',
                    progressPercent: 0
                }
            });

            // Trigger processing even if it exists, to handle restarts or stuck jobs
            jobManager.startProcessing(updatedWorkspace.id);
            return NextResponse.json(updatedWorkspace);
        }

        // Create new workspace
        const workspace = await db.workspace.create({
            data: {
                filename,
                originalName,
                fileHash,
                filePath,
                status: 'UPLOADED',
                processingStage: 'Ready for processing',
            },
        });

        // Trigger background processing
        jobManager.startProcessing(workspace.id);

        return NextResponse.json(workspace);
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
