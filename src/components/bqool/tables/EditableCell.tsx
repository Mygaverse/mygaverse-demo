'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PencilFill, Check, X } from 'react-bootstrap-icons';

interface EditableCellProps {
    value: string | number;
    type?: 'text' | 'number' | 'image';
    onSave: (newValue: string | number) => void;
    prefix?: string; // e.g., "$"
    suffix?: string; // e.g., "%"
}

export function EditableCell({ value, type = 'text', onSave, prefix = '', suffix = '' }: EditableCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState<string | number>(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (currentValue !== value) {
            if (type === 'number') {
                const num = Number(currentValue);
                if (!isNaN(num)) onSave(num);
                else {
                    // Revert if invalid number
                    setCurrentValue(value);
                    setIsEditing(false);
                }
            } else {
                onSave(currentValue);
            }
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setCurrentValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 min-w-[120px]">
                {prefix && <span className="text-gray-500 font-medium">{prefix}</span>}
                <input
                    ref={inputRef}
                    type="text" // Always text to allow free typing
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave} // Save on blur
                    className="w-full px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
                {suffix && <span className="text-gray-500 font-medium">{suffix}</span>}
            </div>
        );
    }

    // Display Mode
    return (
        <div
            className="group flex items-center gap-2 cursor-pointer hover:bg-gray-50 py-1 px-2 -ml-2 rounded transition-colors"
            onClick={() => setIsEditing(true)}
        >
            {type === 'image' ? (
                <div className="relative w-8 h-8 rounded border overflow-hidden bg-gray-100">
                    <img src={String(value)} alt="Product" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center text-white">
                        <PencilFill size={10} />
                    </div>
                </div>
            ) : (
                <>
                    <span className={type === 'number' ? 'font-mono' : ''}>
                        {prefix}{type === 'number' && typeof value === 'number' ? value.toFixed(2) : value}{suffix}
                    </span>
                    <PencilFill size={10} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
            )}
        </div>
    );
}
