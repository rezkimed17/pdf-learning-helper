import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const workspaceId = id;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            // Send initial status
            const workspace = await db.workspace.findUnique({
                where: { id: workspaceId },
            });

            if (workspace) {
                sendEvent({ type: 'STATUS', payload: workspace });
            }

            // Poll for updates (simple implementation for MVP)
            // In a real app, we might use a proper pub/sub (Redis) or EventEmitter
            const interval = setInterval(async () => {
                try {
                    // Check for new progress events
                    // Efficiency note: This is heavy polling, meant for local MVP only.
                    // Ideally we'd track 'lastSeenEventId' from the client or state.
                    // Here, let's just send the latest status and maybe last few events.

                    const freshWorkspace = await db.workspace.findUnique({
                        where: { id: workspaceId },
                        include: {
                            progressEvents: {
                                orderBy: { timestamp: 'desc' },
                                take: 5
                            }
                        }
                    });

                    if (freshWorkspace) {
                        // Determine if we should close stream
                        if (freshWorkspace.status === 'COMPLETED' || freshWorkspace.status === 'FAILED') {
                            sendEvent({ type: 'UPDATE', payload: freshWorkspace });
                            sendEvent({ type: 'DONE', payload: freshWorkspace });
                            clearInterval(interval);
                            controller.close();
                            return;
                        }

                        sendEvent({ type: 'UPDATE', payload: freshWorkspace });
                    }
                } catch (e) {
                    console.error(e);
                    clearInterval(interval);
                    controller.close();
                }
            }, 1000);

            request.signal.addEventListener('abort', () => {
                clearInterval(interval);
                controller.close();
            });
        },
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
