import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/bqool/ui/Modal';
import { Button } from '@/components/bqool/ui/Button';
import { CheckCircleFill } from 'react-bootstrap-icons';

export const FinalLoading = ({ onFinish }: { onFinish: () => void }) => {
    const [progress, setProgress] = useState(0);

    // Simulate "Downloading Data" progress bar
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 5; // Increment progress
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <Modal isOpen={true} onClose={() => {}} title="Setup Complete" width="max-w-2xl" headerStyle='branding'>
            <div className="p-10 flex flex-col items-center text-center">
                
                {/* Success Animation / Icon */}
                <div className="mb-6">
                    <CheckCircleFill className="text-green-500 text-6xl animate-bounce" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Amazon Advertising & Seller Accounts Connected!
                </h2>
                <p className="text-gray-500 mb-8 max-w-md">
                    We are currently syncing your historical data (Campaigns, Products, and Search Terms). This may take a few minutes.
                </p>

                {/* Progress Bar */}
                <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mb-2">
                    <div className="bg-[#0066b7] h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="flex justify-between w-full max-w-md text-xs text-gray-400 mb-8">
                    <span>Initializing...</span>
                    <span>{progress}%</span>
                </div>

                <Button
                    variant="primary" 
                    onClick={onFinish} 
                    disabled={progress < 100}
                    className="w-full max-w-sm py-3 text-lg"
                >
                    {progress < 100 ? 'Syncing Data...' : "Let's Get Started"}
                </Button>
            </div>
        </Modal>
    );
};