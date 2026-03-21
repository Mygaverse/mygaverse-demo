'use client';

import React, { useState, useMemo } from 'react';
import { Pencil, Image as ImageIcon } from 'react-bootstrap-icons';

interface ReportHeaderProps {
    reportName: string;
    setReportName: (name: string) => void;
    adType: string;
    currency: string;
    dateRange: string;
    stores: Array<{ id: string; name: string; flag: string }>;
    campaignNames: string[]; // Pass array of names
}

export const ReportHeader = ({ 
    reportName, 
    setReportName, 
    adType,
    currency, 
    dateRange, 
    stores,
    campaignNames
}: ReportHeaderProps) => {
    const [logo, setLogo] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLogo(URL.createObjectURL(e.target.files[0]));
        }
    };

    // Calculate Real Dates based on "Last X Days"
    const dateDisplay = useMemo(() => {
        const end = new Date();
        const start = new Date();
        let days = 30;
        if (dateRange.includes('7')) days = 7;
        else if (dateRange.includes('14')) days = 14;
        else if (dateRange.includes('60')) days = 60;
        
        start.setDate(end.getDate() - days);
        
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    }, [dateRange]);

    return (
        <div className="flex bg-white border border-[#e2e2e2] mb-8">
            {/* 1. LEFT: Logo Area */}
            <div className="w-[220px] shrink-0 border-r border-[#e2e2e2] flex flex-col items-center justify-center p-6 bg-[#f8f9fa]">
                <div className="w-32 h-32 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                    {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center">
                            <div className="text-[#4aaada] font-bold text-2xl mb-1">Bqool</div>
                            <ImageIcon className="w-6 h-6 text-gray-300 mx-auto" />
                        </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload} accept="image/*" />
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                        <Pencil className="text-white" />
                    </div>
                </div>
            </div>

            {/* 2. RIGHT: Data Grid */}
            <div className="flex-1 flex flex-col">
                
                {/* Row 1: Report Name */}
                <div className="flex border-b border-[#e2e2e2]">
                    <div className="w-[180px] bg-[#f4f9fd] px-6 py-4 text-sm font-medium text-gray-800 flex items-center border-r border-[#e2e2e2]">
                        Report Name
                    </div>
                    <div className="flex-1 px-6 py-4 flex items-center gap-2">
                        {isEditingName ? (
                            <input 
                                type="text" 
                                value={reportName} 
                                onChange={(e) => setReportName(e.target.value)}
                                onBlur={() => setIsEditingName(false)}
                                className="border border-[#4aaada] rounded px-2 py-1 text-sm outline-none w-full max-w-md"
                                autoFocus
                            />
                        ) : (
                            <>
                                <span className="text-base text-gray-900 font-medium">{reportName}</span>
                                <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-[#4aaada] ml-2"><Pencil size={12} /></button>
                            </>
                        )}
                    </div>
                </div>

                {/* Row 2: Ad Type | Currency | Period */}
                <div className="flex border-b border-[#e2e2e2]">
                    {/* Ad Type */}
                    <div className="flex-1 flex">
                        <div className="w-[180px] bg-[#f4f9fd] px-6 py-3 text-sm font-medium text-gray-800 flex items-center border-r border-[#e2e2e2]">Ad Type</div>
                        <div className="flex-1 px-6 py-3 text-sm text-gray-900 flex items-center border-r border-[#e2e2e2]">{adType}</div>
                    </div>
                    {/* Currency */}
                    <div className="flex-[0.6] flex">
                        <div className="w-[100px] bg-[#f4f9fd] px-4 py-3 text-sm font-medium text-gray-800 flex items-center border-r border-[#e2e2e2]">Currency</div>
                        <div className="flex-1 px-4 py-3 text-sm text-gray-900 flex items-center border-r border-[#e2e2e2]">{currency}</div>
                    </div>
                    {/* Period */}
                    <div className="flex-[1] flex">
                        <div className="w-[100px] bg-[#f4f9fd] px-4 py-3 text-sm font-medium text-gray-800 flex items-center border-r border-[#e2e2e2]">Period</div>
                        <div className="flex-1 px-4 py-3 text-sm text-gray-900 flex items-center">{dateDisplay}</div>
                    </div>
                </div>

                {/* Row 3: Amazon Stores */}
                <div className="flex border-b border-[#e2e2e2]">
                    <div className="w-[180px] bg-[#f4f9fd] px-6 py-4 text-sm font-medium text-gray-800 flex items-center border-r border-[#e2e2e2]">
                        <div className="flex items-center gap-2">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" className="h-4" alt="Amazon" />
                            <span></span>
                        </div>
                    </div>
                    <div className="flex-1 px-6 py-4 flex flex-wrap gap-2 items-center">
                        {stores.length > 0 ? stores.map(store => (
                            <div key={store.id} className="flex items-center gap-1.5 border border-[#e2e2e2] rounded-full px-3 py-1 bg-white shadow-sm">
                                <img src={`https://flagcdn.com/w20/${store.flag}.png`} className="w-4 h-3 rounded-[1px]" />
                                <span className="text-xs text-gray-700 font-medium">{store.name}</span>
                            </div>
                        )) : <span className="text-sm text-gray-400">No stores selected</span>}
                    </div>
                </div>

                {/* Row 4: Campaigns (Scrollable List) */}
                <div className="flex flex-1 min-h-[100px]">
                    <div className="w-[180px] bg-[#f4f9fd] px-6 py-4 text-sm font-medium text-gray-800 border-r border-[#e2e2e2]">
                        Campaign
                    </div>
                    <div className="flex-1 px-6 py-4">
                        <div className="max-h-[120px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                            {campaignNames.length > 0 ? campaignNames.map((name, idx) => (
                                <div key={idx} className="text-sm text-gray-700 leading-relaxed border-b border-gray-50 last:border-0 pb-1">
                                    {name}
                                </div>
                            )) : <span className="text-sm text-gray-400">All Active Campaigns</span>}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};