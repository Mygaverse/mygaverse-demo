import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GearWideConnected, CheckCircle, Clock } from 'react-bootstrap-icons';
import { Button } from '@/components/bqool/ui/Button';

interface LaunchStatusModalProps {
    isOpen: boolean;
    onClose: () => void; // Usually disabled during loading
    onNavigateToGoal: () => void;
}

export function LaunchStatusModal({ isOpen, onClose, onNavigateToGoal }: LaunchStatusModalProps) {
    const [step, setStep] = useState<'preparing' | 'success'>('preparing');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen && step === 'preparing') {
            const timer = setTimeout(() => {
                setStep('success');
            }, 5000); // 5 seconds delay
            return () => clearTimeout(timer);
        }
    }, [isOpen, step]);

    useEffect(() => {
        if (!isOpen) setStep('preparing'); // Reset on close
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden flex flex-col items-center p-8 text-center animate-in fade-in zoom-in duration-300 relative">

                {/* CLOSE BUTTON (Only on success?) User didn't specify, but usually "Almost there" is blocking. "All Set" has X. */}
                {step === 'success' && (
                    <button onClick={onNavigateToGoal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                    </button>
                )}

                {/* HEADER */}
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display">
                    {step === 'preparing' ? 'Almost there' : 'All Set'}
                </h2>

                {/* ILLUSTRATION */}
                <div className="mb-6 relative h-40 w-full flex items-center justify-center bg-blue-50/50 rounded-lg border border-blue-100/50">
                    {/* Placeholder Illustration - Using Icons/Shapes to mimic the blue tech style */}
                    {step === 'preparing' ? (
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
                            <Clock size={80} className="text-blue-500 relative z-10 animate-pulse" />
                            <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full border border-blue-200">
                                <GearWideConnected size={24} className="text-blue-600 animate-spin" />
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 animate-scale-up"></div>
                            <CheckCircle size={80} className="text-blue-500 relative z-10" />
                        </div>
                    )}
                </div>

                {/* TEXT CONTENT */}
                <div className="space-y-2 mb-8">
                    {step === 'preparing' ? (
                        <>
                            <h3 className="text-blue-600 text-xl font-bold">Almost there</h3>
                            <p className="text-gray-600 text-lg">
                                Preparing your goal for launch.<br />
                                Just a moment more!
                            </p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-blue-600 text-xl font-bold">All Set</h3>
                            <p className="text-gray-600">
                                Your Campaigns are now being sent to Amazon<br />
                                and may take a few minutes to appear.
                            </p>
                            <div className="pt-2">
                                <span className="text-gray-600">View your campaign goal </span>
                                <button
                                    onClick={onNavigateToGoal}
                                    className="text-blue-600 font-bold hover:underline cursor-pointer outline-none"
                                >
                                    here
                                </button>
                                .
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>,
        document.body
    );
}
