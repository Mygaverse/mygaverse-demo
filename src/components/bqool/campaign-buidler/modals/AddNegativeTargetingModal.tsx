'use client';
import React, { useState } from 'react';
import { X, Trash } from "react-bootstrap-icons";
import { Portal } from "../../ui/Portal";

interface AddNegativeTargetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: { keywords?: { text: string, type: string }[], products?: { asin: string }[] };
}

export const AddNegativeTargetingModal = ({ isOpen, onClose, onSave, initialData }: AddNegativeTargetingModalProps) => {
    const [activeTab, setActiveTab] = useState<'keyword' | 'product'>('keyword');
    const [keywordMatchType, setKeywordMatchType] = useState<'negativeExact' | 'negativePhrase'>('negativeExact');

    // Keyword Inputs
    const [keywordInput, setKeywordInput] = useState('');
    const [addedKeywords, setAddedKeywords] = useState<{ text: string, type: string }[]>([]);

    // Product Inputs
    const [productInput, setProductInput] = useState('');
    const [addedProducts, setAddedProducts] = useState<{ asin: string }[]>([]);

    // Load Initial Data when Open
    React.useEffect(() => {
        if (isOpen) {
            setAddedKeywords(initialData?.keywords || []);
            setAddedProducts(initialData?.products || []);
            setKeywordInput('');
            setProductInput('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleAddKeywords = () => {
        if (!keywordInput.trim()) return;
        const lines = keywordInput.split('\n').map(l => l.trim()).filter(l => l);
        const newKeywords = lines.map(text => ({
            text,
            type: keywordMatchType === 'negativeExact' ? 'Negative Exact' : 'Negative Phrase'
        }));
        setAddedKeywords([...addedKeywords, ...newKeywords]);
        setKeywordInput('');
    };

    const handleAddProducts = () => {
        if (!productInput.trim()) return;
        const lines = productInput.split('\n').map(l => l.trim()).filter(l => l);
        const newProducts = lines.map(asin => ({ asin }));
        setAddedProducts([...addedProducts, ...newProducts]);
        setProductInput('');
    };

    const handleRemoveKeyword = (index: number) => {
        const next = [...addedKeywords];
        next.splice(index, 1);
        setAddedKeywords(next);
    };

    const handleRemoveProduct = (index: number) => {
        const next = [...addedProducts];
        next.splice(index, 1);
        setAddedProducts(next);
    };

    const handleSave = () => {
        onSave({
            keywords: addedKeywords,
            products: addedProducts
        });
        onClose();
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[600px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[#4aaada] border-b border-[#4aaada] shrink-0">
                        <h3 className="text-lg font-bold text-white">Add Negative Targeting</h3>
                        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar Tabs */}
                        <div className="w-[280px] border-r border-gray-200 bg-white flex flex-col pt-4">
                            <button
                                onClick={() => setActiveTab('keyword')}
                                className={`px-6 py-4 text-left font-medium text-base transition-colors border-l-4 ${activeTab === 'keyword' ? 'border-[#4aaada] text-[#4aaada] bg-blue-50' : 'border-transparent text-gray-700 hover:bg-gray-50'}`}
                            >
                                Add Negative Keyword Target
                            </button>
                            <button
                                onClick={() => setActiveTab('product')}
                                className={`px-6 py-4 text-left font-medium text-base transition-colors border-l-4 ${activeTab === 'product' ? 'border-[#4aaada] text-[#4aaada] bg-blue-50' : 'border-transparent text-gray-700 hover:bg-gray-50'}`}
                            >
                                Add Negative Product Target
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            {/* Top Controls */}
                            <div className="border-b border-gray-200 p-4 shrink-0 bg-white">
                                {activeTab === 'keyword' ? (
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-medium text-gray-900">Match Type :</span>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="matchType"
                                                checked={keywordMatchType === 'negativeExact'}
                                                onChange={() => setKeywordMatchType('negativeExact')}
                                                className="text-[#4aaada] focus:ring-[#4aaada]"
                                            />
                                            <span className="text-sm text-gray-700">Negative Exact</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="matchType"
                                                checked={keywordMatchType === 'negativePhrase'}
                                                onChange={() => setKeywordMatchType('negativePhrase')}
                                                className="text-[#4aaada] focus:ring-[#4aaada]"
                                            />
                                            <span className="text-sm text-gray-700">Negative Phrase</span>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="h-[21px]"></div>
                                )}
                            </div>

                            {/* Main Input & List Area */}
                            <div className="flex flex-1 overflow-hidden">
                                {/* Left Input */}
                                <div className="w-1/2 p-4 border-r border-gray-200 flex flex-col">
                                    <textarea
                                        className="flex-1 w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#4aaada] focus:ring-1 focus:ring-[#4aaada] outline-none resize-none"
                                        placeholder="Please separate each target by pressing Enter"
                                        value={activeTab === 'keyword' ? keywordInput : productInput}
                                        onChange={(e) => activeTab === 'keyword' ? setKeywordInput(e.target.value) : setProductInput(e.target.value)}
                                    />
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={activeTab === 'keyword' ? handleAddKeywords : handleAddProducts}
                                            className="px-6 py-2 bg-[#4aaada] hover:bg-[#3a9aca] text-white rounded font-medium transition-colors"
                                        >
                                            Exclude
                                        </button>
                                    </div>
                                </div>

                                {/* Right List */}
                                <div className="w-1/2 flex flex-col bg-gray-50/50">
                                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">Added</span>
                                            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                                +{activeTab === 'keyword' ? addedKeywords.length : addedProducts.length}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => activeTab === 'keyword' ? setAddedKeywords([]) : setAddedProducts([])}
                                            className="text-sm text-[#4aaada] hover:underline"
                                        >
                                            Remove all
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                        {activeTab === 'keyword' ? (
                                            <>
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
                                            </>
                                        ) : (
                                            <>
                                                {/* Header Row */}
                                                <div className="flex text-xs font-medium text-gray-500 mb-2 px-2">
                                                    <div className="flex-1">ASINs</div>
                                                    <div className="w-[30px]"></div>
                                                </div>
                                                {addedProducts.map((p, i) => (
                                                    <div key={i} className="flex items-center bg-white border border-gray-200 rounded p-3 shadow-sm group hover:border-gray-300 transition-colors">
                                                        <div className="flex-1 text-sm text-gray-900">{p.asin}</div>
                                                        <div className="shrink-0 mr-4">
                                                            <span className="inline-block px-2 py-0.5 rounded-full text-xs border border-red-200 text-red-700 bg-red-50">
                                                                Negative Product
                                                            </span>
                                                        </div>
                                                        <div className="w-[30px] flex justify-end">
                                                            <button
                                                                onClick={() => handleRemoveProduct(i)}
                                                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Trash size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
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
