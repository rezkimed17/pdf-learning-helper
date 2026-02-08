'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export default function Home() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [consent, setConsent] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recentWorkspaces, setRecentWorkspaces] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/workspaces')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setRecentWorkspaces(data);
                }
            })
            .catch(err => console.error('Failed to fetch recent workspaces', err));
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !consent) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                throw new Error('Upload failed');
            }

            const workspace = await res.json();
            router.push(`/workspace/${workspace.id}`);
        } catch (err) {
            setError('Failed to upload file. Please try again.');
            setUploading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        PDF Learning Assistant
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Upload a PDF to generate learning modules and quizzes powered by Gemini.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* File Drop Area */}
                        <div className="relative group">
                            <label
                                htmlFor="file-upload"
                                className={clsx(
                                    "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                                    file ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-gray-300 hover:border-blue-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                                )}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {file ? (
                                        <>
                                            <FileText className="w-10 h-10 mb-3 text-green-500" />
                                            <p className="mb-1 text-sm text-gray-600 dark:text-gray-300 font-medium">{file.name}</p>
                                            <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-10 h-10 mb-3 text-gray-400" suppressHydrationWarning />
                                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="font-semibold">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">PDF up to 100 pages</p>
                                        </>
                                    )}
                                </div>
                                <input id="file-upload" type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>

                        {/* Consent */}
                        <div className="flex items-start space-x-3">
                            <div className="flex items-center h-5">
                                <input
                                    id="consent"
                                    type="checkbox"
                                    checked={consent}
                                    onChange={(e) => setConsent(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <label htmlFor="consent" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                I agree that this document will be processed by Google Gemini (AI) in the cloud.
                            </label>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!file || !consent || uploading}
                            className={clsx(
                                "w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all",
                                (!file || !consent) ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700",
                                uploading && "opacity-75 cursor-wait"
                            )}
                        >
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    Uploading...
                                </span>
                            ) : (
                                "Start Processing"
                            )}
                        </button>
                    </form>
                </div>

                {/* Recent Documents */}
                {recentWorkspaces.length > 0 && (
                    <div className="w-full max-w-md">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Recent Documents</h2>
                        <div className="space-y-3">
                            {recentWorkspaces.map((ws) => (
                                <div
                                    key={ws.id}
                                    onClick={() => router.push(`/workspace/${ws.id}`)}
                                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <div className={clsx(
                                            "p-2 rounded-full",
                                            ws.status === 'COMPLETED' ? "bg-green-100 text-green-600 dark:bg-green-900/20" :
                                                ws.status === 'FAILED' ? "bg-red-100 text-red-600 dark:bg-red-900/20" :
                                                    "bg-blue-100 text-blue-600 dark:bg-blue-900/20"
                                        )}>
                                            {ws.status === 'COMPLETED' ? <CheckCircle className="w-5 h-5" /> :
                                                ws.status === 'FAILED' ? <AlertCircle className="w-5 h-5" /> :
                                                    <Upload className="w-5 h-5" />}
                                        </div>
                                        <div className="truncate">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{ws.originalName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(ws.createdAt).toLocaleDateString()} • {ws.status}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-gray-400">
                                        →
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
