'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';

import { Portal } from "@/components/bqool/ui/Portal";
import { Button } from "@/components/bqool/ui/Button";
import { Download, X } from "react-bootstrap-icons";
import { ReportHeader } from './ReportHeader';
import { ReportComments } from './ReportComments';

interface ReportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Context Data
    dateRange: string;
    adType: string;
    selectedStoreIds: string[];
    // We pass the actual dashboard content as children to reuse your existing grid/charts
    children: React.ReactNode;
    currency?: string;
}

export const ReportPreviewModal = ({ 
    isOpen, 
    onClose, 
    dateRange, 
    adType, 
    selectedStoreIds,
    currency = 'USD', 
    children 
}: ReportPreviewModalProps) => {
    
    const [reportName, setReportName] = useState("Amazon Advertising Report");
    const [campaignNames, setCampaignNames] = useState<string[]>([]);
    const [stores, setStores] = useState<Array<{ id: string; name: string; flag: string }>>([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(false);

    // --- FETCH STORES FROM FIRESTORE ---
    useEffect(() => {
        const fetchStoreDetails = async () => {
            if (!selectedStoreIds || selectedStoreIds.length === 0) {
                setStores([]);
                return;
            }

            try {
                // Fetch each selected store document in parallel
                const storePromises = selectedStoreIds.map(id => getDoc(doc(db, 'stores', id)));
                const storeSnapshots = await Promise.all(storePromises);

                const loadedStores = storeSnapshots
                    .filter(snap => snap.exists())
                    .map(snap => {
                        const data = snap.data();
                        return { 
                            id: snap.id, 
                            name: data.name || data.storeName || 'Unknown Store', 
                            // Map 'marketplace' or 'countryCode' to flag (fallback to 'us')
                            flag: (data.countryCode || data.marketplace || 'us').toLowerCase() 
                        };
                    });

                setStores(loadedStores);
            } catch (error) {
                console.error("Error fetching store details:", error);
            }
        };

        if (isOpen) {
            fetchStoreDetails();
        }
    }, [isOpen, selectedStoreIds]);

    // --- FETCH CAMPAIGNS FROM FIRESTORE ---
    useEffect(() => {
        const fetchCampaigns = async () => {
            if (!selectedStoreIds || selectedStoreIds.length === 0) return;
            
            setLoadingCampaigns(true);
            try {
                // Fetch enabled campaigns for the selected stores
                // Note: 'in' query is limited to 10 items. Slice if necessary.
                const q = query(
                    collection(db, 'campaigns'), 
                    where('storeId', 'in', selectedStoreIds.slice(0, 10)),
                    where('enabled', '==', true)
                );
                
                const snapshot = await getDocs(q);
                const names = snapshot.docs.map(doc => doc.data().name);
                setCampaignNames(names);
            } catch (error) {
                console.error("Error fetching campaign names for report:", error);
            } finally {
                setLoadingCampaigns(false);
            }
        };

        if (isOpen) {
            fetchCampaigns();
        }
    }, [isOpen, selectedStoreIds]);

    if (!isOpen) return null;

    return (
        <Portal>
            {/* CRITICAL PRINT STYLES 
               Using a standard <style> tag ensures this works even if styled-jsx isn't configured.
            */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    /* 1. Hide the main app content */
                    body > *:not(#report-print-wrapper) {
                        display: none !important;
                    }

                    /* 2. Reset Body/HTML to allow scrolling */
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* 3. Force the Wrapper to be Static (Flowing) */
                    #report-print-wrapper {
                        position: static !important; /* Overrides 'fixed' */
                        display: block !important;
                        visibility: visible !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important; /* Overrides 'overflow-y-auto' */
                        background: white !important;
                        z-index: 9999 !important;
                        opacity: 1 !important;
                        transform: none !important;
                        inset: auto !important; /* Resets top/left/right/bottom */
                    }

                    /* 4. Remove margins from the inner container for full width */
                    #report-print-root {
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        max-width: 100% !important;
                        width: 100% !important;
                    }

                    /* 5. Utility: Hide UI elements */
                    .no-print {
                        display: none !important;
                    }

                    /* 6. Ensure Graphics Print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    /* 7. Prevent page breaks inside cards/charts */
                    .break-inside-avoid {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
            `}} />

            {/* Outer Wrapper: ID used to reset 'fixed' position during print */}
            <div 
                id="report-print-wrapper" 
                className="fixed inset-0 z-[5000] bg-gray-100 overflow-y-auto animate-in fade-in duration-200 print:animate-none print:opacity-100 print:static print:bg-white"
            >
                
                {/* 1. Top Bar (Actions) */}
                <div className="sticky top-0 z-[5010] bg-[#333] text-white px-6 py-3 flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-4">
                        <span className="font-semibold text-lg">Report Preview</span>
                        <span className="bg-white/10 px-3 py-1 rounded-full text-xs text-white/80">{reportName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="primary" 
                            className="bg-blue-600 hover:bg-blue-500 border-none text-white" 
                            icon={<Download size={16} />}
                            onClick={() => window.print()}
                        >
                            Download PDF Report
                        </Button>
                        <div className="h-6 w-px bg-white/20 mx-2"></div>
                        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                            <X size={28} />
                        </button>
                    </div>
                </div>

                {/* 2. Paper Layout Container */}
                <div id="report-print-root" className="max-w-[1200px] mx-auto my-8 bg-white shadow-2xl min-h-screen flex flex-col print:shadow-none print:m-0 print:w-full">
                    
                    {/* A. Report Header */}
                    <div className="p-8 pb-0 print:p-8">
                        <ReportHeader 
                            reportName={reportName} 
                            setReportName={setReportName}
                            adType={adType}
                            currency={currency}
                            dateRange={dateRange}
                            stores={stores}
                            campaignNames={loadingCampaigns ? ['Loading...'] : campaignNames} 
                        />
                    </div>

                    {/* B. Dashboard Content Injection */}
                    <div className="p-8 space-y-8 print:p-8">
                        <div className="report-content-wrapper">
                            {children}
                        </div>
                    </div>

                    {/* C. Report Footer */}
                    <div className="p-8 pt-0 mt-auto break-inside-avoid">
                        <ReportComments />
                        <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                            <span>Generated by Bqool Advertising</span>
                            <span>{new Date().toLocaleString()}</span>
                        </div>
                    </div>

                </div>
            </div>
        </Portal>
    );
};