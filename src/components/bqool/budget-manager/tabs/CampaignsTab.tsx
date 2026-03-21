'use client';

import React, { useState, useMemo } from 'react';
import { LayoutThreeColumns, Download } from "react-bootstrap-icons";
import { Button } from "../../ui/Button";
import { SearchInputGroup } from "../../ui/SearchInputGroup";
import { MultipleSelector } from "../../ui/MultipleSelector";
import { DynamicTable } from "../../tables/DynamicTable";

import { BudgetCampaignData } from "../data/budget-campaigns";
import { getBudgetCampaignColumns } from "../columns/budget-campaigns-columns";

interface CampaignsTabProps {
    data: any[];
    onSwitchToGroup: (groupId: string) => void;
    onProductAdsClick: (campaign: any) => void;
}

export function CampaignsTab({ data, onSwitchToGroup, onProductAdsClick }: CampaignsTabProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusIds, setStatusIds] = useState<string[]>(['all']);

    // Filter Logic (Simple client-side for demo)
    const filteredData = useMemo(() => {
        return data.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    const columns = getBudgetCampaignColumns(onSwitchToGroup, onProductAdsClick);

    const STATUS_OPTIONS = [
        { id: 'all', label: 'All Campaign Status' },
        { id: 'enabled', label: 'Enabled' },
        { id: 'paused', label: 'Paused' }
    ];

    return (
        <div className="flex flex-col h-full gap-4 relative">
            {/* Controls */}
            <div className="flex items-center gap-3 h-[48px] z-40 relative">
                <div className="flex-1 h-full">
                    <SearchInputGroup 
                        options={['Campaigns', 'Budgeting Group']}
                        selectedOption="Campaigns"
                        onOptionChange={() => {}}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        placeholder="Search by Campaigns"
                    />
                </div>

                <div className="w-[260px]">
                    <MultipleSelector 
                        label="Status"
                        options={STATUS_OPTIONS}
                        selectedIds={statusIds}
                        onChange={setStatusIds}
                        width="w-full"
                    />
                </div>

                <Button variant="secondary" size="lg" icon={<LayoutThreeColumns size={16} />}>Columns</Button>
                <Button variant="secondary" size="lg" icon={<Download size={16} />}>Download</Button>
            </div>

            {/* Table */}
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-md shadow-sm overflow-hidden border border-[#e2e2e2]">
                <DynamicTable 
                    data={data} 
                    columns={columns}
                    //stickyHeader
                    className="h-full border-x border-b border-[#e2e2e2] rounded-b-lg" 
                    emptyVariant="no-results" // Should rarely happen if tab is only enabled when data exists
                />
            </div>
        </div>
    );
}