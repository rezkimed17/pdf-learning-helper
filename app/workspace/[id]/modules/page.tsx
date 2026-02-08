'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Search } from 'lucide-react';

interface Module {
    id: string;
    index: number;
    title: string;
    summary: string;
    keyTerms: string; // JSON string
}

interface Workspace {
    id: string;
    filename: string;
    moduleCount: number;
}

export default function ModulesListPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [modules, setModules] = useState<Module[]>([]);
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/modules/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setModules(data.modules);
                    setWorkspace(data.workspace);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const filteredModules = modules.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div>
                            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-2">
                                <ArrowLeft className="w-4 h-4" /> Upload new PDF
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {workspace?.filename || 'Loading...'}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                <span>{modules.length} Learning Modules</span>
                                <span className="text-gray-300">|</span>
                                <div className="flex gap-2">
                                    <a href={`/api/export/${id}/guide`} className="text-blue-600 hover:underline">
                                        Download Study Guide
                                    </a>
                                    <span className="text-gray-300">•</span>
                                    <a href={`/api/export/${id}/quizzes`} className="text-blue-600 hover:underline">
                                        Export Quiz History
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search modules..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredModules.map((module) => {
                        let terms = [];
                        try { terms = JSON.parse(module.keyTerms); } catch (e) { }

                        return (
                            <Link
                                key={module.id}
                                href={`/workspace/${id}/modules/${module.id}`}
                                className="block group bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all no-underline"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        Module {module.index}
                                    </span>
                                    <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                                    {module.summary}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {terms.slice(0, 3).map((term: string) => (
                                        <span key={term} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            {term}
                                        </span>
                                    ))}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {!loading && filteredModules.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        No modules found matching "{searchTerm}"
                    </div>
                )}

            </div>
        </div>
    );
}
