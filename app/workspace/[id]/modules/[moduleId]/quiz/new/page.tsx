'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NewQuizPage({ params }: { params: Promise<{ id: string; moduleId: string }> }) {
    const { id, moduleId } = use(params);
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generate = async () => {
            try {
                const res = await fetch('/api/quiz/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        workspaceId: id,
                        moduleId: moduleId,
                    }),
                });

                if (!res.ok) throw new Error('Failed to generate quiz');

                const quiz = await res.json();
                router.replace(`/workspace/${id}/modules/${moduleId}/quiz/${quiz.id}`);
            } catch (e) {
                console.error(e);
                setError('Failed to generate quiz. Please try again.');
                // Navigate back after delay?
            }
        };

        generate();
    }, [id, moduleId, router]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600">
                {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <h2 className="text-xl font-bold text-gray-800">Generating Quiz...</h2>
            <p className="text-gray-500">Consulting Gemini to create questions for this module.</p>
        </div>
    );
}
