'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, FilterRight, ChevronDown } from "react-bootstrap-icons";
import { Modal } from "@/components/bqool/ui/Modal";

interface Asset {
    id: string;
    name: string;
    type: 'Logo' | 'Video' | 'Image';
    size: string;
    dimensions: string;
    url: string;
    addedDate: string; // ISO string for sorting
}

const MOCK_ASSETS: Asset[] = [
    { id: '1', name: 'a32364c5-3306-44....png', type: 'Logo', size: '265.8 kb', dimensions: '362 x 453 px', url: 'https://placehold.co/400x500/f8f9fa/4aaada?text=Asset+1', addedDate: '2024-03-10T10:00:00Z' },
    { id: '2', name: 'a380ae92-131b-47....png', type: 'Logo', size: '349.7 kb', dimensions: '362 x 453 px', url: 'https://placehold.co/400x500/f8f9fa/4aaada?text=Asset+2', addedDate: '2024-03-09T10:00:00Z' },
    { id: '3', name: '42819f9c-dbd0-4f....png', type: 'Logo', size: '350.1 kb', dimensions: '362 x 453 px', url: 'https://placehold.co/400x500/f8f9fa/4aaada?text=Asset+3', addedDate: '2024-03-08T10:00:00Z' },
    { id: '4', name: '9c17c756-a214-40....png', type: 'Logo', size: '680.4 kb', dimensions: '463 x 625 px', url: 'https://placehold.co/400x500/f8f9fa/4aaada?text=Asset+4', addedDate: '2024-03-07T10:00:00Z' },
    { id: '5', name: 'b1234567-890a-4b....png', type: 'Image', size: '1.2 mb', dimensions: '1200 x 800 px', url: 'https://placehold.co/600x400/f8f9fa/4aaada?text=Product+Image', addedDate: '2024-03-06T10:00:00Z' },
    { id: '6', name: 'v9876543-210b-4c....mp4', type: 'Video', size: '15.4 mb', dimensions: '1920 x 1080 px', url: 'https://placehold.co/600x400/000/fff?text=Video+Thumbnail', addedDate: '2024-03-05T10:00:00Z' },
];

interface AmazonAssetsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (selectedAsset: Asset) => void;
    filterType?: 'Logo' | 'Video' | 'Image';
}

export const AmazonAssetsModal = ({ isOpen, onClose, onApply, filterType = 'Logo' }: AmazonAssetsModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<string[]>([`Type: ${filterType}`]);

    const filteredAssets = useMemo(() => {
        return MOCK_ASSETS.filter(asset => {
            const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
            // In a real app, we'd filter by asset.type based on activeFilters
            const matchesType = activeFilters.some(f => f.includes(asset.type)) || activeFilters.length === 0;
            return matchesSearch && matchesType;
        });
    }, [searchTerm, activeFilters]);

    const handleRemoveFilter = (filter: string) => {
        setActiveFilters(prev => prev.filter(f => f !== filter));
    };

    const handleApply = () => {
        const asset = MOCK_ASSETS.find(a => a.id === selectedId);
        if (asset) {
            onApply(asset);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Select from Amazon assets"
            width="max-w-[1000px]"
            headerStyle="default"
        >
            <div className="flex flex-col h-full bg-white">
                {/* Description */}
                <div className="px-6 py-2">
                    <p className="text-gray-500 text-sm">
                        Browse and select assets from your Amazon creative library to use in your campaign.
                    </p>
                </div>

                {/* Filter Controls Row */}
                <div className="mx-6 my-4 p-4 border border-gray-200 rounded-lg flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-700">Filter</span>
                        <div className="flex flex-wrap gap-2">
                            {activeFilters.map(filter => (
                                <div key={filter} className="flex items-center gap-1 bg-[#4aaada] text-white px-2 py-1 rounded-full text-xs">
                                    {filter}
                                    <X size={14} className="cursor-pointer" onClick={() => handleRemoveFilter(filter)} />
                                </div>
                            ))}
                            {activeFilters.length > 0 && (
                                <button className="text-[#4aaada] text-xs font-medium hover:underline" onClick={() => setActiveFilters([])}>
                                    Remove all
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Search size={16} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name, tag, or ASIN"
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded text-sm focus:border-[#4aaada] outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter by Dropdown (Mock) */}
                        <button className="flex items-center gap-4 px-3 py-2 border border-gray-200 rounded bg-[#f8f9fa] text-gray-600 text-sm">
                            Filter by <ChevronDown size={12} />
                        </button>

                        <div className="flex-1" />

                        {/* Sort by Dropdown (Mock) */}
                        <button className="flex items-center gap-4 px-3 py-2 border border-gray-200 rounded bg-[#f8f9fa] text-gray-600 text-sm">
                            Sort by: Added: Newest to oldest <ChevronDown size={12} />
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="px-6 py-2 overflow-y-auto max-h-[500px]">
                    <div className="grid grid-cols-4 gap-4 pb-6">
                        {filteredAssets.map(asset => (
                            <div
                                key={asset.id}
                                onClick={() => setSelectedId(asset.id)}
                                className={`flex flex-col border rounded-lg overflow-hidden cursor-pointer transition-all ${
                                    selectedId === asset.id ? 'border-[#4aaada] ring-2 ring-[#4aaada]/30 shadow-md' : 'border-gray-200 hover:border-[#4aaada]/50 hover:shadow-sm'
                                }`}
                            >
                                <div className="h-40 bg-[#f8f9fa] flex items-center justify-center p-4">
                                    <img src={asset.url} alt={asset.name} className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="p-3 border-t border-gray-100 bg-white">
                                    <div className="text-xs font-bold text-gray-800 truncate mb-1">{asset.name}</div>
                                    <div className="text-[10px] text-gray-400">{asset.size} {asset.dimensions}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredAssets.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p>No assets match your search or filter.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-auto px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white z-10 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-200 rounded text-[#4aaada] font-medium text-sm hover:bg-gray-50 bg-white shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!selectedId}
                        className={`px-8 py-2 rounded text-white font-medium text-sm shadow-sm transition-all ${
                            selectedId ? 'bg-[#4aaada] hover:bg-[#3a9aca]' : 'bg-gray-300 cursor-not-allowed'
                        }`}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </Modal>
    );
};
