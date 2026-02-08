'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link'; // Add missing import
import { ArrowLeft, BookOpen, BrainCircuit, History } from 'lucide-react';
import { PdfViewer } from '@/components/PdfViewer';

interface ModuleDetail {
    id: string;
    index: number;
    title: string;
    summary: string;
    keyTerms: string;
    citations: string;
    workspace: {
        id: string;
        filename: string;
    };
    quizzes: any[];
}

export default function ModuleDetailPage({ params }: { params: Promise<{ id: string; moduleId: string }> }) {
    const { id, moduleId } = use(params);
    const [module, setModule] = useState<ModuleDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activePage, setActivePage] = useState<number>(1);
    const [fileUrl, setFileUrl] = useState<string>('');

    useEffect(() => {
        // Note: id is workspaceId, moduleId is moduleId
        // But my API is /api/modules/detail/[moduleId]
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/modules/detail/${moduleId}`);
                if (res.ok) {
                    const data = await res.json();
                    setModule(data);
                    setFileUrl(`/api/files/${data.workspace.filename}`);

                    // Set initial page from first citation if available
                    try {
                        const citations = JSON.parse(data.citations);
                        if (citations.length > 0) setActivePage(citations[0]);
                    } catch (e) { }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [moduleId]);

    if (loading || !module) return <div className="p-8 text-center">Loading...</div>;

    const keyTerms = JSON.parse(module.keyTerms) as string[];
    const citations = JSON.parse(module.citations) as number[];

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between shrink-0 h-16">
                <div className="flex items-center gap-4">
                    <Link href={`/workspace/${id}/modules`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-bold truncate max-w-md">{module.title}</h1>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Module {module.index}</span>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={`/workspace/${id}/modules/${moduleId}/quiz/new`}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                    >
                        <BrainCircuit className="w-4 h-4" />
                        Take Quiz
                    </Link>
                </div>
            </header>

            {/* Content - Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Content */}
                <div className="w-1/2 overflow-y-auto p-8 space-y-8 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">

                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Summary</h2>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg">
                            {module.summary}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Key Terms</h2>
                        <div className="flex flex-wrap gap-2">
                            {keyTerms.map((term) => (
                                <span key={term} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium">
                                    {term}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Source Material</h2>
                        <div className="flex gap-2">
                            {citations.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setActivePage(page)}
                                    className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${activePage === page
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Page {page}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Quiz History</h2>
                        {module.quizzes.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No quizzes taken yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {module.quizzes.map((quiz) => {
                                    const attempt = quiz.attempts[0]; // Assuming we get latest attempt
                                    return (
                                        <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <History className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                                    {new Date(quiz.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                {attempt ? (
                                                    <span className={`font-bold ${attempt.score / attempt.totalQuestions >= 0.7 ? 'text-green-600' : 'text-amber-600'
                                                        }`}>
                                                        {attempt.score}/{attempt.totalQuestions}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">Incomplete</span>
                                                )}
                                                <Link href={`/workspace/${id}/modules/${moduleId}/quiz/${quiz.id}`} className="text-blue-600 hover:underline ml-2">
                                                    Review
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Panel - PDF Viewer */}
                <div className="w-1/2 bg-gray-100 dark:bg-gray-950">
                    {fileUrl && <PdfViewer url={fileUrl} page={activePage} />}
                </div>
            </div>
        </div>
    );
}
