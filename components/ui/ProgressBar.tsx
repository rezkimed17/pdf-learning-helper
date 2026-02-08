import clsx from 'clsx';

interface ProgressBarProps {
    progress: number;
    label?: string;
    stage?: string;
}

export function ProgressBar({ progress, label, stage }: ProgressBarProps) {
    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                <span>{label || 'Processing...'}</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
                ></div>
            </div>
            {stage && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right animate-pulse">
                    {stage}
                </p>
            )}
        </div>
    );
}
