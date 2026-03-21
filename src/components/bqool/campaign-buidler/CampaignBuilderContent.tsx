'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { CameraVideo, CheckLg, ChevronRight } from "react-bootstrap-icons";
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { useRouter } from 'next/navigation';
// UI
import { Button } from "../ui/Button";
import { StepNavigator } from "./sections/StepNavigator";
import { GoalSetupSection } from "./sections/GoalSetupSection";
import { ProductSelectionSection } from "./sections/ProductSelectionSection";
import { StrategySection } from "./sections/StrategySection";
import { DynamicTable } from "../tables/DynamicTable";

import { CampaignBuilderProvider, useCampaignBuilder, CompetingRow } from './data/CampaignBuilderContext';
import { CompetingCampaignsModal } from './modals/CompetingCampaignsModal';

// Table Configs
import { getPreviewColumns, getCompetingColumns, PreviewRow } from "./utils/columns";

// --- INNER COMPONENT (Accesses Context) ---
function BuilderInner() {
    const { user } = useAuth();
    const router = useRouter();
    const {
        storeId, goalName, adType, selectedProducts, strategy, customConfig,
        brandedPhrases, competitorPhrases,
        competingCampaigns, setCompetingCampaigns
    } = useCampaignBuilder();

    // State for user edits on preview rows
    const [rowOverrides, setRowOverrides] = useState<Record<string, Partial<PreviewRow>>>({});
    const [isLaunching, setIsLaunching] = useState(false);
    const [isCompetingModalOpen, setIsCompetingModalOpen] = useState(false);

    // Reset overrides when strategy/goal changes
    useEffect(() => { setRowOverrides({}); }, [strategy, adType]);

    // --- DYNAMIC PREVIEW GENERATION (EXISTING CAMPAIGNS) ---
    const basePreviewData = useMemo(() => {
        if (selectedProducts.length === 0) return [];

        // Group selected products by Campaign ID
        const campaignMap = new Map<string, PreviewRow>();

        // Calculate phrase stats for Brand-Based strategy
        const totalPhrases = brandedPhrases.length + competitorPhrases.length;
        const phraseLabel = brandedPhrases.length > 0 && competitorPhrases.length > 0
            ? 'Mixed'
            : (brandedPhrases.length > 0 ? 'Brand' : 'Competitor');

        // Calculate custom target stats
        const isKw = customConfig.manualType === 'keyword';
        const customCount = isKw ? customConfig.addedKeywords.length : customConfig.addedProducts.length;

        selectedProducts.forEach(p => {
            // Default campaignId to a string if missing to satisfy interface
            const cId = p.campaignId || `orphan-${p.id}`;

            // Only map if product belongs to a campaign
            if (!campaignMap.has(cId)) {
                // Construct the row object
                const row: PreviewRow = {
                    id: cId,

                    // Ensure mandatory 'campaignId' property is present
                    campaignId: cId,

                    // Goal Info
                    goalName: goalName || 'New Goal',
                    // FIX: Ensure 'goalStrategy' property is present
                    goalStrategy: strategy || 'Basic',

                    // Campaign Info
                    campaignName: p.campaignName || 'Unknown Campaign',
                    storeName: p.storeName || 'Store',
                    storeFlag: 'us',
                    adType: adType === 'Sponsored Brands' ? 'SB' : (adType === 'Sponsored Display' ? 'SD' : 'SP'),
                    status: 'Enabled',

                    // Editable Fields
                    budget: 10,
                    aiBidding: true,
                    aiBiddingStrategy: 'Auto Target ACOS',
                    targetAcos: 30, // FIX: Default ACOS
                    autoHarvesting: true,

                    // Strategy Specific
                    phraseType: strategy === 'Brand-Based' ? phraseLabel : undefined,
                    phraseCount: strategy === 'Brand-Based' ? totalPhrases : undefined,
                    targetType: strategy === 'Custom' ? (isKw ? 'Keyword' : 'Targeting') : undefined,
                    targetCount: strategy === 'Custom' ? customCount : undefined
                };
                campaignMap.set(cId, row);
            }
        });

        // IF STRATEGY IS CUSTOM:
        if (strategy === 'Custom') {
            const rows = [];
            const baseName = goalName || 'New Goal';

            if (customConfig.mode === 'auto') {
                // Auto Campaign Row
                rows.push({
                    id: 'custom-auto',
                    goalName: baseName,
                    campaignName: `${baseName} - Auto`,
                    storeFlag: 'us',
                    type: 'Auto',
                    targeting: 'Close, Loose, Sub, Comp', // Or dynamic based on enabled groups
                    budget: 10,
                    aiBidding: true,
                    autoHarvesting: false, // Auto harvesting usually disabled for Auto campaigns?
                    // Custom Columns Data
                    targetType: undefined, // No specific "Targeting" count for Auto
                    targetCount: 0
                });
            } else {
                // Manual Campaign Row
                const isKeyword = customConfig.manualType === 'keyword';
                const count = isKeyword ? customConfig.addedKeywords.length : customConfig.addedProducts.length;

                rows.push({
                    id: 'custom-manual',
                    goalName: baseName,
                    campaignName: `${baseName} - Manual`,
                    storeFlag: 'us',
                    type: 'Manual',
                    targeting: isKeyword ? 'Keywords' : 'Products',
                    budget: 10,
                    aiBidding: true,
                    autoHarvesting: true,
                    // Custom Columns Data
                    targetType: isKeyword ? 'Keyword' : 'Targeting', // Matches image text
                    targetCount: count
                });
            }
            return rows;
        }

        return Array.from(campaignMap.values());
    }, [goalName, selectedProducts, strategy, brandedPhrases, competitorPhrases, customConfig, adType]);

    // --- 2. MERGE DATA WITH OVERRIDES (FIXED TYPING) ---
    const tableData = useMemo<PreviewRow[]>(() => {
        return basePreviewData.map(row => {
            const override = rowOverrides[row.id] || {};
            // Explicit cast to PreviewRow ensures we tell TS that required fields are present
            return {
                ...row,
                ...override
            } as PreviewRow;
        });
    }, [basePreviewData, rowOverrides]);

    // --- ROW UPDATE HANDLER ---
    const handleRowUpdate = useCallback((id: string, field: keyof PreviewRow, value: any) => {
        setRowOverrides(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    }, []);

    // --- FETCH COMPETING CAMPAIGNS ---
    useEffect(() => {
        const fetchCompeting = async () => {
            if (!user || !storeId || selectedProducts.length === 0) {
                setCompetingCampaigns([]);
                return;
            }

            try {
                // Query Product Ads that match the selected ASINs in this store
                // 'in' queries are limited to 10. For >10 products, we'd need to batch or query all active ads.
                // For efficiency in this demo, let's query Active Product Ads and filter client side.

                const q = query(
                    collection(db, 'product_ads'),
                    where('storeId', '==', storeId),
                    where('status', '==', 'ENABLED') // Only check against enabled ads
                );
                const snap = await getDocs(q);

                const selectedAsins = new Set(selectedProducts.map(p => p.asin));

                // Find existing ads that target these ASINs
                const conflicts = snap.docs
                    .map(d => d.data())
                    .filter(ad => selectedAsins.has(ad.asin)) // Overlapping product
                    .map(ad => ({
                        id: ad.campaignId + ad.asin, // Unique key for table
                        productName: ad.productName || ad.name || 'Unknown',
                        productImage: ad.productImage || 'https://placehold.co/40x40',
                        asin: ad.asin,
                        sku: ad.sku || '-',
                        competingAdGroup: ad.adGroupName || 'Unknown Ad Group',
                        competingCampaign: ad.campaignName || 'Unknown Campaign',
                        status: true // Since we filtered by ENABLED
                    } as CompetingRow));

                setCompetingCampaigns(conflicts);

            } catch (e) {
                console.error("Error checking conflicts", e);
            }
        };

        fetchCompeting();
    }, [user, storeId, selectedProducts, setCompetingCampaigns]);

    // --- LAUNCH HANDLER ---
    const handleLaunch = async () => {
        if (!user || !goalName) {
            alert("Please complete Goal Setup.");
            return;
        }
        if (selectedProducts.length === 0) {
            alert("Please select products.");
            return;
        }

        setIsLaunching(true);
        try {
            const batch = writeBatch(db);

            // Use tableData (which has user edits)
            tableData.forEach(row => {
                // Ensure we are updating a valid document ID
                if (row.id && !row.id.startsWith('orphan')) {
                    const docRef = doc(db, 'campaigns', row.id);
                    const updatePayload: any = {
                        goalName: row.goalName,
                        goalStatus: strategy,
                        budget: row.budget, // User edited budget
                        aiBidding: row.aiBidding,
                        autoHarvesting: row.autoHarvesting,
                        lastUpdated: new Date().toISOString(),
                        // Ownership (User Isolation)
                        createdBy: user.uid,
                        creatorName: user.displayName || user.email || 'User',
                    };

                    if (strategy === 'Brand-Based') {
                        updatePayload.brandedPhrases = brandedPhrases;
                        updatePayload.competitorPhrases = competitorPhrases;
                    }
                    batch.update(docRef, updatePayload);
                }
            });

            await batch.commit();

            alert("Goal Launched Successfully!");
            router.push('/bqool/ad-manager'); // Redirect to dashboard

        } catch (e) {
            console.error("Error launching goal:", e);
            alert("Failed to launch goal.");
        } finally {
            setIsLaunching(false);
        }
    };

    return (
        <div className="mx-auto w-full pb-20">
            <GoalSetupSection />
            <ProductSelectionSection />
            <StrategySection />

            {/* PREVIEW */}
            <div id="preview" className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-[#e2e2e2] font-bold text-gray-900 text-lg">Preview</div>
                <div className="p-6">
                    <DynamicTable
                        data={tableData}
                        columns={getPreviewColumns(strategy, handleRowUpdate)}
                        className="min-h-0"
                    />
                </div>
            </div>

            {/* COMPETING */}
            <div id="competing" className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-[#e2e2e2] font-bold text-gray-900 text-lg">Competing Campaign</div>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-6 mt-6 text-sm text-yellow-800">
                    <span className="font-bold">⚠ Competing campaigns occur when multiple campaigns target the same products simultaneously.</span>
                    <p className="mt-1">To prevent this, BQool Campaign Builder will automatically pause competing campaigns within 48 hours.</p>
                </div>
                <div className="p-6">
                    <DynamicTable data={competingCampaigns} columns={getCompetingColumns()} className="min-h-0" />
                </div>
            </div>

            {/* LAUNCH */}
            <div id="launch" className="flex justify-center gap-4 mt-8 pt-6">
                <Button variant="secondary" size="lg" onClick={() => router.back()}>Cancel</Button>
                <Button
                    variant="primary"
                    size="lg"
                    icon={<CheckLg size={18} />}
                    onClick={handleLaunch}
                    disabled={isLaunching}
                >
                    {isLaunching ? 'Launching...' : 'Launch Goal'}
                </Button>
            </div>
        </div>
    );
}

export function CampaignBuilderContent() {

    return (
        <CampaignBuilderProvider>
            <div className="w-full flex flex-col mx-auto p-6 space-y-4 pb-20 min-h-screen scroll-smooth">

                {/* 1. Header Row */}
                <div className="flex items-center justify-between shrink-0">
                    <Breadcrumb />
                    <Button variant="branding" size="lg" icon={<CameraVideo size={18} />}>Learn</Button>
                </div>

                {/* 2. Steps Navbar */}
                <StepNavigator />

                {/* 3. Main Body */}
                <BuilderInner />
            </div>
        </CampaignBuilderProvider>
    );
}

function Breadcrumb() {
    return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-gray-900 font-medium text-lg">Advertising</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="font-medium">Campaign Builder</span>
        </div>
    );
}