'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CaretUpFill, CaretDownFill } from "react-bootstrap-icons";
import { Portal } from "@/components/bqool/ui/Portal"; // Assuming you have this from previous code

export type SortDirection = 'asc' | 'desc' | null;
export type SortType = 'text' | 'number';

interface ColumnSorterProps {
    columnKey: string;
    currentSort: { key: string; direction: SortDirection };
    onSort: (key: string, direction: SortDirection) => void;
    type?: SortType; // Defaults to 'text'
    label?: string;  // The header text
}

export const ColumnSorter = ({ 
    columnKey, 
    currentSort, 
    onSort, 
    type = 'text',
    label 
}: ColumnSorterProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const isActive = currentSort.key === columnKey;

    const toggleOpen = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent table header click events if any
        
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({ 
                top: rect.bottom + window.scrollY + 4, 
                left: rect.left + window.scrollX 
            });
        }
        setIsOpen(!isOpen);
    };

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const close = () => setIsOpen(false);
        window.addEventListener('click', close);
        window.addEventListener('scroll', close, true); // Close on scroll to avoid floating issues
        return () => { 
            window.removeEventListener('click', close); 
            window.removeEventListener('scroll', close, true);
        };
    }, [isOpen]);

    const handleSort = (dir: 'asc' | 'desc') => {
        onSort(columnKey, dir);
        setIsOpen(false);
    };

    // Visual indicators for active sort
    const renderIcon = () => {
        if (!isActive || !currentSort.direction) {
            return (
                <div className="flex flex-col ml-2 opacity-30 group-hover:opacity-100 transition-opacity">
                    <CaretUpFill size={8} />
                    <CaretDownFill size={8} />
                </div>
            );
        }
        return currentSort.direction === 'asc' 
            ? <CaretUpFill size={10} className="ml-2 text-[#4aaada]" />
            : <CaretDownFill size={10} className="ml-2 text-[#4aaada]" />;
    };

    return (
        <>
            <button 
                ref={buttonRef}
                onClick={toggleOpen}
                className={`flex items-center text-xs hover:bg-gray-50 rounded px-1 py-1 -ml-1 transition-colors group ${isActive ? 'font-bold text-gray-900' : ''}`}
            >
                {label}
                {renderIcon()}
            </button>

            {isOpen && (
                <Portal>
                    <div 
                        className="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-xl py-1 w-32 animate-in fade-in zoom-in-95 duration-75 flex flex-col"
                        style={{ top: coords.top, left: coords.left }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {type === 'text' ? (
                            <>
                                <button 
                                    onClick={() => handleSort('asc')}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${isActive && currentSort.direction === 'asc' ? 'text-[#4aaada] font-medium bg-gray-50' : 'text-gray-700'}`}
                                >
                                    <CaretUpFill size={10} /> A to Z
                                </button>
                                <button 
                                    onClick={() => handleSort('desc')}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${isActive && currentSort.direction === 'desc' ? 'text-[#4aaada] font-medium bg-gray-50' : 'text-gray-700'}`}
                                >
                                    <CaretDownFill size={10} /> Z to A
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={() => handleSort('asc')}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${isActive && currentSort.direction === 'asc' ? 'text-[#4aaada] font-medium bg-gray-50' : 'text-gray-700'}`}
                                >
                                    <CaretUpFill size={10} /> Low to High
                                </button>
                                <button 
                                    onClick={() => handleSort('desc')}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${isActive && currentSort.direction === 'desc' ? 'text-[#4aaada] font-medium bg-gray-50' : 'text-gray-700'}`}
                                >
                                    <CaretDownFill size={10} /> High to Low
                                </button>
                            </>
                        )}
                    </div>
                </Portal>
            )}
        </>
    );
};