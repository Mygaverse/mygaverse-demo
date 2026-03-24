'use client';
import React, { useState, useEffect } from 'react';
import { X } from "react-bootstrap-icons";
import { Button } from "../../ui/Button";
import { Portal } from "../../ui/Portal";

interface AdvancedSettingsData {
    biddingStrategy: 'down_only' | 'up_down' | 'fixed';
    placementTop: number;
    placementProduct: number;
}

interface AdvancedSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: AdvancedSettingsData) => void;
    initialData?: Partial<AdvancedSettingsData>;
}

export const AdvancedSettingsModal = ({ isOpen, onClose, onSave, initialData }: AdvancedSettingsModalProps) => {
    const [strategy, setStrategy] = useState<'down_only' | 'up_down' | 'fixed'>('down_only');
    const [placementTop, setPlacementTop] = useState(0);
    const [placementProduct, setPlacementProduct] = useState(0);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setStrategy(initialData?.biddingStrategy || 'down_only');
            setPlacementTop(initialData?.placementTop || 0);
            setPlacementProduct(initialData?.placementProduct || 0);
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        onSave({
            biddingStrategy: strategy,
            placementTop,
            placementProduct
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[#4aaada] border-b border-[#4aaada]">
                        <h3 className="text-lg font-bold text-white">Advanced Setting</h3>
                        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="overflow-y-auto max-h-[80vh]">

                        {/* 1. Schedule Section */}
                        <div className="flex border-b border-gray-200 p-6">
                            <div className="w-[180px] shrink-0 pt-2 text-base font-medium text-gray-900">Schedule</div>
                            <div className="flex items-center gap-6 flex-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-900">Start date</span>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value="02/18/2023"
                                            readOnly
                                            className="w-[140px] border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900 focus:outline-[#4aaada]"
                                        />
                                        {/* Mock Calendar Icon */}
                                        <div className="absolute right-2 top-1.5 text-[#4aaada]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-900">End date</span>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value="No end date"
                                            readOnly
                                            className="w-[140px] border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900 focus:outline-[#4aaada]"
                                        />
                                        <div className="absolute right-2 top-1.5 text-[#4aaada]">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Bidding Strategy Section */}
                        <div className="flex border-b border-gray-200 p-6">
                            <div className="w-[180px] shrink-0 pt-2 text-base font-medium text-gray-900">Bidding Strategy</div>
                            <div className="flex-1 space-y-4">

                                {/* Option 1: Down Only */}
                                <label className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${strategy === 'down_only' ? 'border-[#4aaada] ring-1 ring-[#4aaada]' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="pt-0.5">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${strategy === 'down_only' ? 'border-[#4aaada]' : 'border-gray-300'}`}>
                                            {strategy === 'down_only' && <div className="w-2.5 h-2.5 rounded-full bg-[#4aaada]" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="strategy"
                                            className="hidden"
                                            checked={strategy === 'down_only'}
                                            onChange={() => setStrategy('down_only')}
                                        />
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-gray-900">Dynamic Bids - Down Only</div>
                                        <div className="text-sm text-gray-400 mt-1">We'll lower your bids in real time when your ad may be less likely to convert to a sale.</div>
                                    </div>
                                </label>

                                {/* Option 2: Up & Down */}
                                <label className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${strategy === 'up_down' ? 'border-[#4aaada] ring-1 ring-[#4aaada]' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="pt-0.5">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${strategy === 'up_down' ? 'border-[#4aaada]' : 'border-gray-300'}`}>
                                            {strategy === 'up_down' && <div className="w-2.5 h-2.5 rounded-full bg-[#4aaada]" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="strategy"
                                            className="hidden"
                                            checked={strategy === 'up_down'}
                                            onChange={() => setStrategy('up_down')}
                                        />
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-gray-900">Dynamic Bids - Up & Down</div>
                                        <div className="text-sm text-gray-400 mt-1">We'll raise your bids (by a maximum of 100%) in real time when your ad may be more likely to convert to a sale, and lower your bids when less likely to convert to a sale.</div>
                                    </div>
                                </label>

                                {/* Option 3: Fixed */}
                                <label className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${strategy === 'fixed' ? 'border-[#4aaada] ring-1 ring-[#4aaada]' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="pt-0.5">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${strategy === 'fixed' ? 'border-[#4aaada]' : 'border-gray-300'}`}>
                                            {strategy === 'fixed' && <div className="w-2.5 h-2.5 rounded-full bg-[#4aaada]" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="strategy"
                                            className="hidden"
                                            checked={strategy === 'fixed'}
                                            onChange={() => setStrategy('fixed')}
                                        />
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-gray-900">Fixed Bids</div>
                                        <div className="text-sm text-gray-400 mt-1">We'll use your exact bid and any manual adjustments you set, and typically won't change your bids based on likelihood of a sale.</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* 3. Placement Section */}
                        <div className="flex border-b border-gray-200 p-6">
                            <div className="w-[180px] shrink-0 pt-2 text-base font-medium text-gray-900">Adjust Bids by Placement</div>
                            <div className="flex-1">
                                <div className="space-y-4 max-w-md">
                                    {/* Top */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-[200px] text-base text-gray-900">Top of search (first page)</label>
                                        <div className="relative w-[100px]">
                                            <input
                                                type="number"
                                                min="0" max="900"
                                                value={placementTop}
                                                onChange={(e) => setPlacementTop(Number(e.target.value))}
                                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-right pr-6 focus:border-[#4aaada] outline-none"
                                            />
                                            <span className="absolute right-2 top-1.5 text-gray-500">%</span>
                                        </div>
                                    </div>
                                    {/* Rest */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-[200px] text-base text-gray-900">Rest of search</label>
                                        <div className="relative w-[100px]">
                                            <input
                                                type="number"
                                                min="0" max="900"
                                                value={0}
                                                readOnly
                                                className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-1.5 text-right pr-6 focus:border-[#4aaada] outline-none text-gray-500"
                                            />
                                            <span className="absolute right-2 top-1.5 text-gray-500">%</span>
                                        </div>
                                    </div>
                                    {/* Product */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-[200px] text-base text-gray-900">Product pages</label>
                                        <div className="relative w-[100px]">
                                            <input
                                                type="number"
                                                min="0" max="900"
                                                value={placementProduct}
                                                onChange={(e) => setPlacementProduct(Number(e.target.value))}
                                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-right pr-6 focus:border-[#4aaada] outline-none"
                                            />
                                            <span className="absolute right-2 top-1.5 text-gray-500">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 bg-white">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium transition-colors"
                        >
                            <X size={18} />
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-2 bg-[#4aaada] hover:bg-[#3a9aca] text-white rounded font-medium transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                            </svg>
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
