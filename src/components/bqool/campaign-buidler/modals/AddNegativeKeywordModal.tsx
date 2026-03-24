'use client';
import React, { useState } from 'react';
import { X, Trash } from "react-bootstrap-icons";
import { Portal } from "../../ui/Portal";

interface AddNegativeKeywordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: { keywords?: { text: string, type: string }[] };
}

export const AddNegativeKeywordModal = ({ isOpen, onClose, onSave, initialData }: AddNegativeKeywordModalProps) => {
    const [matchType, setMatchType] = useState<'negativeExact' | 'negativePhrase'>('negativeExact');
    const [keywordInput, setKeywordInput] = useState('');
    const [addedKeywords, setAddedKeywords] = useState<{ text: string, type: string }[]>([]);

    // Load Initial Data
    React.useEffect(() => {
        if (isOpen) {
            setAddedKeywords(initialData?.keywords || []);
            setKeywordInput('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleAddKeywords = () => {
        if (!keywordInput.trim()) return;
        const lines = keywordInput.split('\n').map(l => l.trim()).filter(l => l);
        const newKeywords = lines.map(text => ({
            text,
            type: matchType === 'negativeExact' ? 'Negative Exact' : 'Negative Phrase'
        }));
        setAddedKeywords([...addedKeywords, ...newKeywords]);
        setKeywordInput('');
    };

    const handleRemoveKeyword = (index: number) => {
        const next = [...addedKeywords];
        next.splice(index, 1);
        setAddedKeywords(next);
    };

    const handleSave = () => {
        onSave({ keywords: addedKeywords });
        onClose();
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[#4aaada] border-b border-[#4aaada] shrink-0">
                        <h3 className="text-lg font-bold text-white">Add Negative Keyword Targeting</h3>
                        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 overflow-hidden">

                        {/* Left Input */}
                        <div className="w-1/2 p-4 border-r border-gray-200 flex flex-col bg-white">
                            <div className="flex items-center gap-4 mb-3">
                                <span className="text-sm font-medium text-gray-900">Match Type :</span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="modalMatchType"
                                        checked={matchType === 'negativeExact'}
                                        onChange={() => setMatchType('negativeExact')}
                                        className="text-[#4aaada] focus:ring-[#4aaada]"
                                    />
                                    <span className="text-sm text-gray-700">Negative Exact</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="modalMatchType"
                                        checked={matchType === 'negativePhrase'}
                                        onChange={() => setMatchType('negativePhrase')}
                                        className="text-[#4aaada] focus:ring-[#4aaada]"
                                    />
                                    <span className="text-sm text-gray-700">Negative Phrase</span>
                                </label>
                            </div>

                            <textarea
                                className="flex-1 w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#4aaada] focus:ring-1 focus:ring-[#4aaada] outline-none resize-none"
                                placeholder="Please separate each target by pressing Enter"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                            />

                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleAddKeywords}
                                    className="px-6 py-2 bg-[#4aaada] hover:bg-[#3a9aca] text-white rounded font-medium transition-colors"
                                >
                                    Exclude
                                </button>
                            </div>
                        </div>

                        {/* Right List */}
                        <div className="w-1/2 flex flex-col bg-gray-50/50">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">Added</span>
                                    <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                        +{addedKeywords.length}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setAddedKeywords([])}
                                    className="text-sm text-[#4aaada] hover:underline"
                                >
                                    Remove all
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {/* Header Row */}
                                <div className="flex text-xs font-medium text-gray-500 mb-2 px-2">
                                    <div className="flex-1">Keywords</div>
                                    <div className="w-[120px]">Match Type</div>
                                    <div className="w-[30px]"></div>
                                </div>
                                {addedKeywords.map((k, i) => (
                                    <div key={i} className="flex items-center bg-white border border-gray-200 rounded p-3 shadow-sm group hover:border-gray-300 transition-colors">
                                        <div className="flex-1 text-sm text-gray-900">{k.text}</div>
                                        <div className="w-[120px]">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${k.type === 'Negative Exact' ? 'border-red-200 text-red-700 bg-red-50' : 'border-orange-200 text-orange-700 bg-orange-50'
                                                }`}>
                                                {k.type}
                                            </span>
                                        </div>
                                        <div className="w-[30px] flex justify-end">
                                            <button
                                                onClick={() => handleRemoveKeyword(i)}
                                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-t border-gray-200 shrink-0">
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
