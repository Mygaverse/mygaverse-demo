import { Campaign, AdGroup, Targeting, Product } from "./schema";

// --- 1. MOCK INVENTORY (What you see in IM) ---
export const MOCK_INVENTORY: Product[] = [
    { asin: 'B00BW6KCTU', sku: 'PLS-GRN-01', name: '[Green] Lawonda Phone Lanyard', price: 15.99, imageUrl: '...' },
    { asin: 'B0C3VB4P78', sku: 'PLS-PUR-02', name: '[Purple] Lawonda Phone Lanyard', price: 15.99, imageUrl: '...' },
    // ...
];

// --- 2. CAMPAIGN GENERATOR ---
const generateMetrics = () => ({
    adSales: Math.floor(Math.random() * 5000),
    adSpend: Math.floor(Math.random() * 500),
    acos: Math.floor(Math.random() * 100),
    roas: Math.random() * 10,
    orders: Math.floor(Math.random() * 200),
    units: Math.floor(Math.random() * 250),
    cvr: Math.random() * 100,
    impressions: Math.floor(Math.random() * 10000),
    clicks: Math.floor(Math.random() * 500),
    ctr: Math.random() * 5,
    cpc: Math.random() * 2
});

export const MOCK_STORE_DATA = {
    campaigns: [
        // SP Campaign
        { 
            id: 'cmp_sp_1', storeId: 'store_1', name: 'SP_Phone_Lanyard_Manual', adType: 'SP', 
            status: 'ENABLED', dailyBudget: 50, targetingType: 'MANUAL', biddingStrategy: 'Dynamic Down',
            ...generateMetrics()
        },
        // SB Campaign
        { 
            id: 'cmp_sb_1', storeId: 'store_1', name: 'SB_Brand_Defense', adType: 'SB', 
            status: 'ENABLED', dailyBudget: 100, costType: 'CPC',
            ...generateMetrics()
        },
    ] as Campaign[],

    adGroups: [
        // Ad Groups for SP Campaign
        { id: 'ag_1', campaignId: 'cmp_sp_1', name: 'Exact_Match_High', status: 'ENABLED', defaultBid: 1.50, ...generateMetrics() },
        { id: 'ag_2', campaignId: 'cmp_sp_1', name: 'Broad_Discovery', status: 'PAUSED', defaultBid: 0.75, ...generateMetrics() },
        // Ad Groups for SB Campaign
        { id: 'ag_3', campaignId: 'cmp_sb_1', name: 'Video_Ad_Top', status: 'ENABLED', defaultBid: 2.00, adFormat: 'Video', ...generateMetrics() }
    ] as AdGroup[]
};