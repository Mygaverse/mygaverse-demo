'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore functions
import { db } from '@/lib/bqool/firebase'; // Import DB
import { UnifiedCampaign } from '../data/unifiedAdManagerData';
import { Badge } from '@/components/bqool/ui/Badge';
import { Button } from '@/components/bqool/ui/Button';
import { BudgetCell } from '@/components/bqool/tables/cells/BudgetCell'; // Reusing your existing component
import { Search, ChevronDown } from 'react-bootstrap-icons';
import { Portal } from '@/components/bqool/ui/Portal';

interface CampaignEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaign: UnifiedCampaign | null;
    onSave: (id: string, updates: Partial<UnifiedCampaign>) => Promise<void>;
}

export const CampaignEditModal = ({ isOpen, onClose, campaign, onSave }: CampaignEditModalProps) => {
    const [activeTab, setActiveTab] = useState<'settings' | 'negative'>('settings');
    
    // Form State
    const [name, setName] = useState('');
    const [status, setStatus] = useState('');
    const [budget, setBudget] = useState(0);
    const [portfolio, setPortfolio] = useState('');
    const [strategy, setStrategy] = useState('Dynamic bids - down only');

    // Portfolio Options State
    const [portfolioOptions, setPortfolioOptions] = useState<string[]>([]);
    
    // Mock Placement Bids
    const [topSearch, setTopSearch] = useState(0);
    const [productPages, setProductPages] = useState(0);

    // 1. Fetch Real Portfolios on Mount
    useEffect(() => {
        const fetchPortfolios = async () => {
            try {
                // In a real app, you might have a dedicated 'portfolios' collection.
                // Here we fetch unique values from existing campaigns.
                const snap = await getDocs(collection(db, 'campaigns'));
                const uniquePortfolios = new Set<string>();
                
                snap.forEach(doc => {
                    const data = doc.data();
                    if (data.portfolio) uniquePortfolios.add(data.portfolio);
                });
                
                setPortfolioOptions(Array.from(uniquePortfolios).sort());
            } catch (error) {
                console.error("Error fetching portfolios:", error);
            }
        };

        if (isOpen) {
            fetchPortfolios();
        }
    }, [isOpen]);

    // Sync state when campaign opens
    // 2. Sync state when campaign opens
    useEffect(() => {
        if (campaign) {
            setName(campaign.name);
            setStatus(campaign.enabled ? 'Enabled' : 'Paused');
            setBudget(campaign.budget);
            setPortfolio(campaign.portfolio || ''); // Set real portfolio
            // Reset others to defaults or load from campaign if available
            setTopSearch(0);
            setProductPages(0);
        }
    }, [campaign]);

    if (!campaign || !isOpen) return null;

    const handleSave = () => {
        onSave(campaign.id, {
            name,
            budget,
            enabled: status === 'Enabled',
            portfolio
        });
        onClose();
    };

    // --- RENDERERS ---

    const renderHeader = () => (
        <div className="bg-[#4aaada] px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex flex-col gap-1 text-white">
                <h2 className="text-lg font-bold leading-tight">{campaign.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-xs backdrop-blur-sm">
                        <img src={`https://flagcdn.com/w20/${campaign.flag}.png`} className="w-3.5 h-2.5 rounded-[1px]" alt="flag" />
                        <span>{campaign.storeName}</span>
                    </div>
                    <div className="bg-white/20 px-2 py-0.5 rounded text-xs backdrop-blur-sm">
                        {campaign.type === 'SP' ? 'SP Manual' : campaign.type}
                    </div>
                    <div className="bg-white/20 px-2 py-0.5 rounded text-xs backdrop-blur-sm">
                        {status}
                    </div>
                    <div className="bg-white/90 text-[#4aaada] px-2 py-0.5 rounded text-xs font-semibold">
                        Goal: {campaign.goalName || 'Advanced'}
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>
    );

    const renderSettingsTab = () => (
        <div className="flex flex-col border border-[#e2e2e2] rounded-md overflow-hidden bg-white">
            {/* Row 1: Name */}
            <div className="flex border-b border-[#e2e2e2]">
                <div className="w-1/3 bg-gray-50 p-4 text-sm font-medium text-gray-700 flex items-center">Campaign Name</div>
                <div className="w-2/3 p-3">
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-[#4aaada] outline-none"
                    />
                </div>
            </div>

            {/* Row 2: Portfolio */}
            <div className="flex border-b border-[#e2e2e2]">
                <div className="w-1/3 bg-gray-50 p-4 text-sm font-medium text-gray-700 flex items-center">Portfolio</div>
                <div className="w-2/3 p-3">
                    <div className="relative">
                        <select 
                            value={portfolio}
                            onChange={(e) => setPortfolio(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm appearance-none bg-white outline-none focus:border-[#4aaada]"
                        >
                            <option value="">No Portfolio</option>
                            {portfolioOptions.map((port) => (
                                <option key={port} value={port}>{port}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Row 3: Campaign Type (Read Only) */}
            <div className="flex border-b border-[#e2e2e2]">
                <div className="w-1/3 bg-gray-50 p-4 text-sm font-medium text-gray-700 flex items-center">Campaign Type</div>
                <div className="w-2/3 p-4 text-sm text-gray-900">
                    {campaign.type === 'SP' ? 'Sponsored Products - Manual Targeting' : `Sponsored ${campaign.type === 'SB' ? 'Brands' : 'Display'}`}
                </div>
            </div>

            {/* Row 4: Status */}
            <div className="flex border-b border-[#e2e2e2]">
                <div className="w-1/3 bg-gray-50 p-4 text-sm font-medium text-gray-700 flex items-center">Campaign Status</div>
                <div className="w-2/3 p-3">
                    <div className="relative w-40">
                        <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm appearance-none bg-white outline-none focus:border-[#4aaada]"
                        >
                            <option value="Enabled">Enabled</option>
                            <option value="Paused">Paused</option>
                            <option value="Archived">Archived</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Row 5: Schedule */}
            <div className="flex border-b border-[#e2e2e2]">
                <div className="w-1/3 bg-gray-50 p-4 text-sm font-medium text-gray-700 flex items-center">Campaign Schedule</div>
                <div className="w-2/3 p-3 flex items-center gap-3">
                    <div className="relative">
                        <input type="date" className="border border-gray-300 rounded px-3 py-1.5 text-sm outline-none text-gray-600" defaultValue="2021-02-18" />
                    </div>
                    <div className="h-px w-4 bg-gray-300"></div>
                    <button className="text-gray-400 text-sm border border-gray-300 rounded px-4 py-1.5 bg-gray-50">No end date</button>
                    <div className="flex items-center gap-1.5 ml-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-[#4aaada] rounded border-gray-300 focus:ring-[#4aaada]" />
                        <span className="text-sm text-gray-700">No end date</span>
                    </div>
                </div>
            </div>

            {/* Row 6: Budget */}
            <div className="flex border-b border-[#e2e2e2]">
                <div className="w-1/3 bg-gray-50 p-4 text-sm font-medium text-gray-700 flex items-center">Daily Budget</div>
                <div className="w-2/3 p-3">
                    <div className="flex flex-col gap-1">
                        <div className="w-32">
                            <BudgetCell value={budget} isAuto={false} onChange={setBudget} />
                        </div>
                        {budget < 1 && <span className="text-[10px] text-red-500 flex items-center gap-1">⚠️ Daily budget must be at least 1.00</span>}
                    </div>
                </div>
            </div>

            {/* Row 7: Bidding Strategy */}
            <div className="flex border-b border-[#e2e2e2]">
                <div className="w-1/3 bg-gray-50 p-4 text-sm font-medium text-gray-700 flex items-center">Campaign Bidding Strategy</div>
                <div className="w-2/3 p-3">
                    <div className="relative w-64">
                        <select 
                            value={strategy}
                            onChange={(e) => setStrategy(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm appearance-none bg-white outline-none focus:border-[#4aaada]"
                        >
                            <option>Dynamic bids - down only</option>
                            <option>Dynamic bids - up and down</option>
                            <option>Fixed bids</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Row 8: Adjust Bids */}
            <div className="flex">
                <div className="w-1/3 bg-gray-50 p-4 text-sm font-medium text-gray-700 flex items-start pt-6">Adjust Bids by Placement</div>
                <div className="w-2/3 p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Top of search (first page)</span>
                        <div className="flex items-center border border-gray-300 rounded px-2 py-1 w-24">
                            <input type="number" className="w-full text-sm outline-none text-right" value={topSearch} onChange={(e) => setTopSearch(Number(e.target.value))} />
                            <span className="ml-1 text-gray-500 text-sm">%</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Rest of search</span>
                        <div className="flex items-center border border-gray-300 rounded px-2 py-1 w-24">
                            <input type="number" className="w-full text-sm outline-none text-right" defaultValue={0} />
                            <span className="ml-1 text-gray-500 text-sm">%</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Product pages</span>
                        <div className="flex items-center border border-gray-300 rounded px-2 py-1 w-24">
                            <input type="number" className="w-full text-sm outline-none text-right" value={productPages} onChange={(e) => setProductPages(Number(e.target.value))} />
                            <span className="ml-1 text-gray-500 text-sm">%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderNegativeTab = () => (
        <div className="flex flex-col gap-4">
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search /></div>
                <input type="text" placeholder="Search keywords" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:border-[#4aaada] outline-none" />
            </div>
            
            <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-medium">
                        <tr>
                            <th className="px-4 py-3">Negative Keywords</th>
                            <th className="px-4 py-3 w-40">Match Type</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {/* Mock Data as requested */}
                        <tr><td className="px-4 py-3">lanyard cell phone</td><td className="px-4 py-3"><Badge variant="neutral" size="sm">Negative Exact</Badge></td></tr>
                        <tr><td className="px-4 py-3">crossbody lanyard cell phone</td><td className="px-4 py-3"><Badge variant="neutral" size="sm">Negative Phrase</Badge></td></tr>
                        <tr><td className="px-4 py-3">phone lanyard</td><td className="px-4 py-3"><Badge variant="neutral" size="sm">Negative Exact</Badge></td></tr>
                        <tr><td className="px-4 py-3">lanyard cell phone</td><td className="px-4 py-3"><Badge variant="neutral" size="sm">Negative Exact</Badge></td></tr>
                        <tr><td className="px-4 py-3">crossbody lanyard cell phone</td><td className="px-4 py-3"><Badge variant="neutral" size="sm">Negative Phrase</Badge></td></tr>
                    </tbody>
                </table>
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <span>Display</span>
                        <select className="border border-gray-300 rounded px-1 py-0.5 bg-white"><option>25</option></select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>20 Results, Page</span>
                        <input type="text" defaultValue="1" className="w-8 text-center border border-gray-300 rounded py-0.5" />
                        <span>of 5</span>
                        <div className="flex gap-1">
                            <button className="px-2 py-0.5 border bg-white rounded">&lt;</button>
                            <button className="px-2 py-0.5 border bg-white rounded">&gt;</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- MAIN RENDER ---
    // We are NOT using the generic Modal wrapper here because this modal needs
    // a completely custom header and layout structure (Sidebar + Content).
    // So we render a custom fullscreen overlay.

    return (
        <Portal>
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={(e) => {if(e.target === e.currentTarget) onClose()}}>
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    {/* 1. Branding Header */}
                    {renderHeader()}

                    {/* 2. Body: Sidebar + Main Content */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* Sidebar */}
                        <div className="w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0 p-4 flex flex-col gap-1">
                            <button 
                                onClick={() => setActiveTab('settings')}
                                className={`text-left px-4 py-2.5 rounded text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-white text-[#4aaada] shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                            >
                                Campaign Settings
                            </button>
                            <button 
                                onClick={() => setActiveTab('negative')}
                                className={`text-left px-4 py-2.5 rounded text-sm font-medium transition-colors ${activeTab === 'negative' ? 'bg-white text-[#4aaada] shadow-sm border border-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                            >
                                Negative Targeting
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 bg-white">
                            {activeTab === 'settings' ? renderSettingsTab() : renderNegativeTab()}
                        </div>
                    </div>

                    {/* 3. Footer */}
                    <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center shrink-0">
                        <Button variant="ghost" onClick={onClose} className="text-gray-600 hover:text-gray-900">Cancel</Button>
                        <Button variant="primary" onClick={handleSave} className="bg-[#4aaada] hover:bg-[#3a9ad0] text-white px-6">Save</Button>
                    </div>
                </div>
            </div>
        </Portal>  
    );
};