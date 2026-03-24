import React from 'react';

interface LoaderProps {
    text?: string;
    className?: string;
}

export function Loader({ text = "Loading...", className = "" }: LoaderProps) {
    return (
        <div className={`fixed inset-0 z-[2000] flex items-center justify-center bg-gray-50 ${className}`}>
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500">{text}</p>
            </div>
        </div>
    );
}
