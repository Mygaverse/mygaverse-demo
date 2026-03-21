'use client';

import React from 'react';
import { Modal } from "@/components/bqool/ui/Modal";
import { DynamicTable } from "../../tables/DynamicTable";
import { getCompetingColumns } from "../utils/columns"; // Use your existing columns definition
import { CompetingRow } from "../data/CampaignBuilderContext";

interface CompetingCampaignsModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: CompetingRow[];
}

export const CompetingCampaignsModal = ({ isOpen, onClose, data }: CompetingCampaignsModalProps) => {
    const columns = getCompetingColumns();

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Competing Campaigns" 
            width="max-w-6xl" 
            headerStyle="default" // Blue header style per your image
        >
            <div className="p-6 bg-white min-h-[400px]">
                {data.length > 0 ? (
                    <div className="border border-[#e2e2e2] rounded-lg overflow-hidden">
                        <DynamicTable 
                            data={data} 
                            columns={columns} 
                            className="min-h-0" 
                        />
                        {/* Pagination placeholder if needed */}
                        <div className="px-4 py-3 border-t border-[#e2e2e2] flex justify-between items-center text-sm text-gray-500">
                            <div>Display 25</div>
                            <div>{data.length} Results, Page 1 of 1</div>
                        </div>
                    </div>
                ) : (
                    // Empty State Image
                    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                        <img 
                            src="https://cdn.bqool.com/images/crm/no-data.svg" // Replace with your actual asset path
                            alt="No Data" 
                            className="w-48 mb-6 opacity-80"
                        />
                        <p className="text-gray-600 font-medium">Data download in process. Check back in 24 hours.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};