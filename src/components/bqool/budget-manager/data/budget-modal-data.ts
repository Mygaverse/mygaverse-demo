export interface ModalCampaignData {
    id: string;
    name: string;
    asin?: string; // Kept for reference if needed, though campaigns usually don't have ASINs directly displayed like products
    status: string; // 'Enabled', 'Paused', 'Archived'
    image?: string; // Optional icon/image
}

export interface ModalGoalData {
    id: string;
    name: string;
    storeFlag: string;
    storeName: string;
    adType: string; // 'SB', 'SP', 'SD'
    status: string; // Goal status
    
    // Structure: Goal -> Campaigns
    campaigns?: ModalCampaignData[]; 
    
    isDisabled?: boolean;
    disabledReason?: string;
}

// --- MOCK DATA (Goal -> Campaigns) ---

export const MOCK_SP_GOALS: ModalGoalData[] = [
    {
        id: "goal-1",
        name: "Q4_Seasonal_Push_Strategy",
        storeFlag: "us", storeName: "BlueMall",
        adType: "SP", status: "Enabled",
        campaigns: [
            { id: "sp-c1", name: "SP_Manual_Lanyards_Broad", status: "Enabled" },
            { id: "sp-c2", name: "SP_Auto_Lanyards_Discovery", status: "Paused" },
            { id: "sp-c3", name: "SP_Manual_Competitor_Targeting", status: "Enabled" }
        ]
    },
    {
        id: "goal-2",
        name: "Inventory_Clearance_2024",
        storeFlag: "us", storeName: "BlueMall",
        adType: "SP", status: "Enabled",
        campaigns: [
            { id: "sp-c4", name: "SP_Low_Bid_Catchall", status: "Archived" },
            { id: "sp-c5", name: "SP_Category_Electronics", status: "Enabled" }
        ]
    }
];

export const MOCK_SB_GOALS: ModalGoalData[] = [
    {
        id: "goal-sb-1",
        name: "Brand_Awareness_Video_Push",
        storeFlag: "us", storeName: "BlueMall",
        adType: "SB", status: "Enabled",
        campaigns: [
            { id: "sb-c1", name: "SB_Video_Homepage_Header", status: "Enabled" },
            { id: "sb-c2", name: "SB_Product_Collection_BestSellers", status: "Enabled" }
        ]
    }
];

export const MOCK_SD_GOALS: ModalGoalData[] = [
    {
        id: "goal-sd-1",
        name: "Retargeting_Display_Strategy",
        storeFlag: "us", storeName: "BlueMall",
        adType: "SD", status: "Enabled",
        isDisabled: true,
        disabledReason: "Incompatible Strategy Type"
    }
];