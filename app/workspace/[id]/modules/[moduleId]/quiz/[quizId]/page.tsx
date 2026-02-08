'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface Question {
    index: number;
    prompt: string;
    options: string[];
    correct_index: number;
    explanation: string;
    cited_page?: number;
}

interface QuizData {
    id: string;
    questions: string; // JSON
    attempts: any[];
}

export default function QuizPage({ params }: { params: Promise<{ id: string; moduleId: string; quizId: string }> }) {
    const { id, moduleId, quizId } = use(params);
    const router = useRouter();
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [attempt, setAttempt] = useState<any>(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await fetch(`/api/quiz/${quizId}`);
                if (res.ok) {
                    const data = await res.json();
                    setQuiz(data);
                    if (data.attempts && data.attempts.length > 0) {
                        setAttempt(data.attempts[0]);
                        // Hydrate answers from attempt if needed, 
                        // but usually we just show results mode.
                        setAnswers(JSON.parse(data.attempts[0].answers));
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [quizId]);

    const handleOptionSelect = (qIndex: number, optionIndex: number) => {
        if (attempt) return; // Read-only if already attempted
        setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
    };

    const handleSubmit = async () => {
        if (!quiz) return;
        setSubmitting(true);

        try {
            const res = await fetch('/api/quiz/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quizId: quiz.id,
                    answers
                })
            });

            if (res.ok) {
                const newAttempt = await res.json();
                setAttempt(newAttempt);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !quiz) return <div className="p-12 text-center">Loading quiz...</div>;

    const questions: Question[] = JSON.parse(quiz.questions);
    const isReview = !!attempt;

    // Calculate generic progress
    const answeredCount = Object.keys(answers).length;
    const isComplete = answeredCount === questions.length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 md:p-12">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href={`/workspace/${id}/modules/${moduleId}`}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Module
                    </Link>

                    {isReview && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Score:</span>
                            <span className={clsx(
                                "text-lg font-bold",
                                attempt.score / questions.length >= 0.7 ? "text-green-600" : "text-amber-600"
                            )}>
                                {Math.round((attempt.score / questions.length) * 100)}%
                            </span>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-6 md:p-8 space-y-8">
                        {questions.map((q, i) => {
                            const selected = answers[q.index];
                            const isCorrect = isReview && selected === q.correct_index;
                            const isWrong = isReview && selected !== q.correct_index;

                            return (
                                <div key={q.index} className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                        <span className="text-gray-400 mr-2">{i + 1}.</span>
                                        {q.prompt}
                                    </h3>

                                    <div className="space-y-2 pl-6">
                                        {q.options.map((opt, optIndex) => {
                                            let optionClass = "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800";

                                            if (isReview) {
                                                if (optIndex === q.correct_index) {
                                                    optionClass = "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400";
                                                } else if (selected === optIndex) {
                                                    optionClass = "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400";
                                                } else {
                                                    optionClass = "opacity-50 border-gray-100 dark:border-gray-800";
                                                }
                                            } else if (selected === optIndex) {
                                                optionClass = "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400 ring-1 ring-blue-500";
                                            }

                                            return (
                                                <button
                                                    key={optIndex}
                                                    onClick={() => handleOptionSelect(q.index, optIndex)}
                                                    disabled={isReview}
                                                    className={clsx(
                                                        "w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between",
                                                        optionClass
                                                    )}
                                                >
                                                    <span>{opt}</span>
                                                    {isReview && optIndex === q.correct_index && (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    )}
                                                    {isReview && selected === optIndex && optIndex !== q.correct_index && (
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {isReview && (
                                        <div className="mt-4 ml-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border-l-4 border-blue-500 text-gray-600 dark:text-gray-300">
                                            <span className="font-semibold block mb-1 text-gray-900 dark:text-gray-100">Explanation:</span>
                                            {q.explanation}
                                            {q.cited_page && (
                                                <p className="mt-2 text-xs text-gray-400">Reference: Page {q.cited_page}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 dark:bg-gray-950/50 p-6 border-t border-gray-100 dark:border-gray-800 sticky bottom-0 flex justify-end">
                        {!isReview ? (
                            <button
                                onClick={handleSubmit}
                                disabled={!isComplete || submitting}
                                className={clsx(
                                    "px-6 py-2 rounded-lg font-medium text-white transition-all",
                                    isComplete ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20" : "bg-gray-300 cursor-not-allowed",
                                    submitting && "opacity-75 cursor-wait"
                                )}
                            >
                                {submitting ? 'Submitting...' : 'Submit Quiz'}
                            </button>
                        ) : (
                            <Link
                                href={`/workspace/${id}/modules/${moduleId}/quiz/new`}
                                className="px-6 py-2 rounded-lg font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all"
                            >
                                Take Another Quiz
                            </Link>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
