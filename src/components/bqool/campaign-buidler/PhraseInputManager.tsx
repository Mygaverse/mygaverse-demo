'use client';
import React, { useState } from 'react';
import { PlusCircleFill, Trash3 } from "react-bootstrap-icons";

interface PhraseInputManagerProps {
    title: string;
    placeholder?: string;
    value?: string[];
    onChange?: (phrases: string[]) => void;
}

export const PhraseInputManager = ({ title, placeholder = "Enter phrases separated by Enter", value, onChange }: PhraseInputManagerProps) => {
    // Local state for the text area input
    const [inputValue, setInputValue] = useState("");
    
    // Local state fallback (if parent doesn't provide value/onChange)
    const [localItems, setLocalItems] = useState<string[]>([]);

    // Determine which list to show (Controlled vs Uncontrolled)
    const items = value !== undefined ? value : localItems;

    const handleUpdateItems = (newItems: string[]) => {
        if (onChange) {
            onChange(newItems);
        } else {
            setLocalItems(newItems);
        }
    };

    const handleAdd = () => {
        if (!inputValue.trim()) return;

        // Split by newline and remove empty strings
        const newPhrases = inputValue.split('\n').filter(line => line.trim() !== "");

        // Merge unique items
        const uniqueSet = new Set([...items, ...newPhrases]);
        const updatedList = Array.from(uniqueSet);

        handleUpdateItems(updatedList);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAdd();
        }
    };

    const handleRemove = (indexToRemove: number) => {
        const updatedList = items.filter((_, idx) => idx !== indexToRemove);
        handleUpdateItems(updatedList);
    };

    const handleRemoveAll = () => {
        handleUpdateItems([]);
    };

    return (
        <div className="bg-[#e9ecef] border border-[#e2e2e2] rounded-md overflow-hidden mb-4">
            <div className="px-4 py-2 font-bold text-sm text-gray-800 border-b border-[#e2e2e2] bg-white">
                {title}
            </div>
            <div className="flex h-[200px] bg-white">
                {/* Left: Input */}
                <div className="flex-1 border-r border-[#e2e2e2] flex flex-col p-3">
                    <textarea 
                        className="flex-1 w-full resize-none outline-none text-sm p-2 border border-gray-200 rounded focus:border-[#4aaada] focus:ring-1 focus:ring-[#4aaada] transition-all"
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex justify-end mt-2">
                        <button 
                            onClick={handleAdd}
                            className="bg-[#4aaada] text-white text-xs px-3 py-2 rounded flex items-center gap-1 hover:bg-[#3a9aca] transition-colors"
                        >
                            <PlusCircleFill size={16}/> Add Phrases
                        </button>
                    </div>
                </div>

                {/* Right: List */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="px-3 py-3 border-b border-[#e2e2e2] flex justify-between items-center bg-[#f1f7ff]">
                        <span className="text-sm font-semibold text-gray-600">Added</span>
                        <span className="text-xs font-bold text-gray-600">{items.length}</span>
                    </div>
                    <div className="px-3 py-3 border-b border-[#e2e2e2] flex justify-between items-center bg-[#fafafa]">
                         <span className="text-sm font-semibold text-gray-600">Phrases</span>
                         {items.length > 0 && (
                             <button onClick={handleRemoveAll} className="text-sm text-[#0066b7] hover:underline">Remove all</button>
                         )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-0">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center px-3 py-2 border-b border-gray-50 hover:bg-gray-50 group">
                                <span className="text-sm text-gray-700 truncate">{item}</span>
                                <button onClick={() => handleRemove(idx)} className="text-gray-400 hover:text-red-500">
                                    <Trash3 size={12} />
                                </button>
                            </div>
                        ))}
                        {items.length === 0 && <div className="text-center text-xs text-gray-400 mt-10">No phrases added</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};