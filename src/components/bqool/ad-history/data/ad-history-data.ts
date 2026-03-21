export interface HistoryBase {
    id: string;
    dateTime: string;
    goalName: string;
    goalType: string; // 'Basic', 'Advanced'
    campaignName: string;
    storeFlag: string;
    storeName: string;
    adType: string; // 'SP Manual', 'SB', etc.
}

export interface BiddingHistoryRow extends HistoryBase {
    adGroupName: string;
    targeting: string;
    targetingType: string; // 'Broad', 'Phrase', 'Category'
    ruleName: string;
    bidFrom: string;
    bidTo: string;
}

export interface HarvestingHistoryRow extends HistoryBase {
    adGroupName: string;
    ruleName: string;
    targetingAdded: string;
    targetingType: string; // 'Broad', 'Phrase', 'Negative Keyword'
    sourceAsin?: string; // For expanded/ASIN targeting
}

export interface BudgetingHistoryRow extends HistoryBase {
    budgetingGroupName: string;
    ruleName: string;
    budgetFrom: string;
    budgetTo: string;
}

// --- MOCK DATA ---

export const MOCK_BIDDING_HISTORY: BiddingHistoryRow[] = [
    {
        id: 'bid-1', dateTime: '12/31/2024 2:09:11 PM PST',
        goalName: "Serghei's Custom Campaign", goalType: 'Basic',
        campaignName: "SP_B0C3VB4P78_Phone Lanyard", storeFlag: 'us', storeName: 'BlueMall', adType: 'SP Manual',
        adGroupName: "B0C3VB4P78_Broad", targeting: "iPhone 14 accessories", targetingType: "Broad",
        ruleName: "AI-Bidding", bidFrom: "$1.23", bidTo: "$2.34"
    },
    {
        id: 'bid-2', dateTime: '11/30/2024 10:15:00 AM PST',
        goalName: "Q4 Strategy Push", goalType: 'Advanced',
        campaignName: "SB_Video_Ads_Holiday", storeFlag: 'us', storeName: 'BlueMall', adType: 'SB',
        adGroupName: "Video_Main", targeting: "category:Electronics", targetingType: "Category",
        ruleName: "AI-Bidding", bidFrom: "$0.90", bidTo: "$1.50"
    },
    {
        id: 'bid-3', dateTime: '11/30/2024 10:15:00 AM PST',
        goalName: "Q4 Strategy Push", goalType: 'Advanced',
        campaignName: "SB_Video_Ads_Holiday", storeFlag: 'us', storeName: 'BlueMall', adType: 'SB',
        adGroupName: "Video_Main", targeting: "category:Electronics", targetingType: "Category",
        ruleName: "AI-Bidding", bidFrom: "$0.90", bidTo: "$1.50"
    },
    {
        id: 'bid-4', dateTime: '11/30/2024 10:15:00 AM PST',
        goalName: "Q4 Strategy Push", goalType: 'Advanced',
        campaignName: "SB_Video_Ads_Holiday", storeFlag: 'us', storeName: 'BlueMall', adType: 'SB',
        adGroupName: "Video_Main", targeting: "category:Electronics", targetingType: "Category",
        ruleName: "AI-Bidding", bidFrom: "$0.90", bidTo: "$1.50"
    },
    {
        id: 'bid-5', dateTime: '11/30/2024 10:15:00 AM PST',
        goalName: "Q4 Strategy Push", goalType: 'Advanced',
        campaignName: "SB_Video_Ads_Holiday", storeFlag: 'us', storeName: 'BlueMall', adType: 'SB',
        adGroupName: "Video_Main", targeting: "category:Electronics", targetingType: "Category",
        ruleName: "AI-Bidding", bidFrom: "$0.90", bidTo: "$1.50"
    },
    {
        id: 'bid-6', dateTime: '11/30/2024 10:15:00 AM PST',
        goalName: "Q4 Strategy Push", goalType: 'Advanced',
        campaignName: "SB_Video_Ads_Holiday", storeFlag: 'us', storeName: 'BlueMall', adType: 'SB',
        adGroupName: "Video_Main", targeting: "category:Electronics", targetingType: "Category",
        ruleName: "AI-Bidding", bidFrom: "$0.90", bidTo: "$1.50"
    }
];

export const MOCK_HARVESTING_HISTORY: HarvestingHistoryRow[] = [
    {
        id: 'har-1', dateTime: '12/31/2024 2:09:11 PM PST',
        goalName: "Serghei's Custom Campaign", goalType: 'Basic',
        campaignName: "SP_B0C3VB4P78_Phone Lanyard", storeFlag: 'us', storeName: 'BlueMall', adType: 'SP Manual',
        adGroupName: "B0C3VB4P78_Broad",
        ruleName: "Auto-Harvesting", targetingAdded: "iPhone 14 charger", targetingType: "Broad"
    },
    {
        id: 'har-2', dateTime: '10/31/2024 4:20:00 PM PST',
        goalName: "Competitor Defense", goalType: 'Advanced',
        campaignName: "SP_Competitor_Targeting", storeFlag: 'us', storeName: 'BlueMall', adType: 'SP Auto',
        adGroupName: "Comp_Exact",
        ruleName: "Auto-Harvesting", targetingAdded: "Phone lanyard", targetingType: "Negative Keyword"
    }
];

export const MOCK_BUDGETING_HISTORY: BudgetingHistoryRow[] = [
    {
        id: 'bud-1', dateTime: '12/31/2024 2:09:11 PM PST',
        budgetingGroupName: "Group_Lanyard Adjustable Crossbody Cell Phone Strap...",
        goalName: "Serghei's Custom Campaign", goalType: 'Basic',
        campaignName: "SP_B0C3VB4P78_Phone Lanyard", storeFlag: 'us', storeName: 'BlueMall', adType: 'SP Manual',
        ruleName: "Auto-Budgeting", budgetFrom: "$1.23", budgetTo: "$2.34"
    }
];