import { useEffect, useRef } from 'react';
import { CheckCircle, Loader2, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

export interface ProgressEvent {
    id: string;
    stage: string;
    message: string;
    timestamp: string;
    percent: number;
}

interface EventFeedProps {
    events: ProgressEvent[];
}

export function EventFeed({ events }: EventFeedProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [events]);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 flex flex-col space-y-3">
            {events.length === 0 && (
                <p className="text-gray-400 text-sm text-center my-auto">Waiting for events...</p>
            )}

            {events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mt-0.5 min-w-[1.25rem]">
                        {event.stage === 'FAILED' ? (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : event.stage === 'COMPLETED' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                            <Info className="w-4 h-4 text-blue-500" />
                        )}
                    </div>
                    <div className="flex-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100 mr-2">
                            [{new Date(event.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                            {event.message}
                        </span>
                    </div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
}
