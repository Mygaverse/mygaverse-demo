import React from 'react';
import { CheckCircleFill, Circle, CircleFill, XCircleFill } from 'react-bootstrap-icons';

type Status = 'pending' | 'in_progress' | 'solved' | 'verified' | 'not_verified' | 'archived';

interface StatusStepperProps {
    status: Status;
}

export function StatusStepper({ status }: StatusStepperProps) {
    const steps = [
        { id: 'pending', label: 'Pending' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'solved', label: 'Solved' },
        { id: 'verified', label: 'Verified' },
    ];

    // Determine current step index
    let activeIndex = steps.findIndex(s => s.id === status);
    if (status === 'not_verified') activeIndex = 2; // Treat as Solved but rejected
    if (status === 'archived') activeIndex = 4; // Completed

    return (
        <div className="w-full mb-8">
            <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-[11px] left-0 w-full h-0.5 bg-gray-200 -z-10" />
                <div
                    className="absolute top-[11px] left-0 h-0.5 bg-purple-600 -z-10 transition-all duration-500"
                    style={{ width: `${(Math.min(activeIndex, steps.length - 1) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index < activeIndex || status === 'archived';
                    const isCurrent = index === activeIndex;
                    const isRejected = step.id === 'verified' && status === 'not_verified';

                    return (
                        <div key={step.id} className="flex flex-col items-center bg-white px-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-2 z-10 transition-colors
                                ${isRejected ? 'text-red-600 bg-white' :
                                    isCompleted ? 'text-purple-600 bg-white' :
                                        isCurrent ? 'text-purple-600 ring-4 ring-purple-100 bg-white' : 'text-gray-300 bg-white'}
                            `}>
                                {isRejected ? <XCircleFill size={20} /> :
                                    isCompleted ? <CheckCircleFill size={20} /> :
                                        isCurrent ? <CircleFill size={16} /> :
                                            <Circle size={16} />}
                            </div>
                            <span className={`text-xs font-bold ${isCurrent || isCompleted ? 'text-purple-900' : 'text-gray-400'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            {status === 'not_verified' && (
                <div className="mt-2 text-center text-xs text-red-600 font-medium bg-red-50 py-1 rounded">
                    Verification Failed - More Info Required
                </div>
            )}
        </div>
    );
}
