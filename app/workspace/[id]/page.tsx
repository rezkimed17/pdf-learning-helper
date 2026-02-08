'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EventFeed, ProgressEvent } from '@/components/ui/EventFeed';
import { AlertCircle, FileText } from 'lucide-react';
// @ts-ignore
import { EventSourcePolyfill } from 'event-source-polyfill';
import clsx from 'clsx';


interface WorkspaceState {
    id: string;
    filename: string;
    status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    processingStage: string;
    progressPercent: number;
}

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
    const [events, setEvents] = useState<ProgressEvent[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch
    useEffect(() => {
        // Initial fetch
        fetch(`/api/workspace/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setWorkspace(data);
                }
            })
            .catch(err => console.error('Failed to fetch initial workspace state', err));
        // I should probably make a specific GET endpoint or just use the stream connection for everything. 
        // The stream sends initial state. Let's rely on stream.
    }, []);

    // SSE Connection
    useEffect(() => {
        let es: EventSource | null = null;

        const connect = () => {
            console.log('Connecting to SSE...');
            es = new EventSource(`/api/workspace/${id}/stream`);

            es.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'STATUS' || data.type === 'UPDATE') {
                        setWorkspace(data.payload);

                        // If we have progressEvents in payload (nested), update them
                        if (data.payload.progressEvents) {
                            // Merge distinct events or replace? 
                            // Since the API sends "last 5", we might miss some if we just replace.
                            // But for MVP, replacing is safer to avoid dupes if we don't have good ID tracking.
                            // Let's just prepend new ones if we filter by ID.
                            // Actually the API sends the whole workspace object with nested events.
                            // Let's assume the API sends *new* events or we just display what we get.
                            // In my API implementation: 
                            // include: { progressEvents: { orderBy: { timestamp: 'desc' }, take: 5 } }
                            // So it sends the latest 5.
                            // We should probably accumulate them in the UI if we want a full history,
                            // or just show the latest 5. Let's accumulate unique ones.

                            setEvents((prev) => {
                                const newEvents = data.payload.progressEvents as ProgressEvent[];
                                const prevIds = new Set(prev.map(e => e.id));
                                const uniqueNew = newEvents.filter(e => !prevIds.has(e.id));
                                // Add new ones to the end (since we want chronological order, but API sends desc. flip it)
                                return [...prev, ...uniqueNew.reverse()];
                            });
                        }
                    }

                    if (data.type === 'DONE') {
                        es?.close();
                        if (data.payload.status === 'COMPLETED') {
                            // Delay redirect slightly
                            setTimeout(() => router.push(`/workspace/${id}/modules`), 1000);
                        }
                    }
                } catch (e) {
                    console.error('Error parsing SSE', e);
                }
            };

            es.onerror = (err) => {
                console.error('SSE Error', err);
                // Only close if it's a fatal error or completion
                // Browser native EventSource retries automatically.
            };
        };

        connect();

        return () => {
            if (es) es.close();
        };
    }, [id, router]);

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h2 className="text-xl font-semibold">Error</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!workspace) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                    <div className="h-2 w-48 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (workspace.status === 'FAILED') {
        return (
            <div className="flex h-screen items-center justify-center p-8">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-red-200">
                    <div className="flex items-center gap-3 text-red-600 mb-4">
                        <AlertCircle className="w-8 h-8" />
                        <h2 className="text-xl font-bold">Processing Failed</h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {workspace.processingStage || "An unknown error occurred."}
                    </p>
                    <div className="h-48 overflow-y-auto bg-gray-50 p-4 rounded text-xs font-mono mb-6">
                        {events.map(e => (
                            <div key={e.id} className="mb-1 text-red-800">{e.message}</div>
                        ))}
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{workspace.filename}</h1>
                            <p className="text-sm text-gray-500">Workspace ID: {workspace.id.slice(0, 8)}...</p>
                        </div>
                    </div>
                    <div className={clsx(
                        "px-3 py-1 rounded-full text-xs font-semibold",
                        workspace.status === 'PROCESSING' ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"
                    )}>
                        {workspace.status}
                    </div>
                </div>

                {/* Progress Section */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">Processing Document</h2>
                        <p className="text-gray-500">Gemini is analyzing your document and generating learning modules.</p>
                    </div>

                    <ProgressBar
                        progress={workspace.progressPercent}
                        stage={workspace.processingStage}
                    />

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Activity Log</h3>
                        <EventFeed events={events} />
                    </div>
                </div>

            </div>
        </div>
    );
}
