import { db } from '@/lib/db';

type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

class JobManager {
    private static instance: JobManager;
    private processing: Set<string> = new Set();

    private constructor() { }

    public static getInstance(): JobManager {
        if (!JobManager.instance) {
            JobManager.instance = new JobManager();
        }
        return JobManager.instance;
    }

    async startProcessing(workspaceId: string) {
        if (this.processing.has(workspaceId)) return;

        console.log(`Starting job for workspace ${workspaceId}`);
        this.processing.add(workspaceId);

        try {
            // Update status to processing
            await db.workspace.update({
                where: { id: workspaceId },
                data: { status: 'PROCESSING', processingStage: 'Initializing...' }
            });

            // Call actual processing logic (Gemini)
            const { processPdf } = await import('./analysis');
            await processPdf(workspaceId);

        } catch (error) {
            console.error(`Job failed for workspace ${workspaceId}:`, error);
            await db.workspace.update({
                where: { id: workspaceId },
                data: { status: 'FAILED', processingStage: 'Error occurred' }
            });
        } finally {
            this.processing.delete(workspaceId);
        }
    }
}

export const jobManager = JobManager.getInstance();
