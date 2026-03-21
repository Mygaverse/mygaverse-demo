// dashboard-next/app/lib/types.ts

// 1. Shared Metric Interface (Avoids repeating these 10 fields everywhere)
export interface Metrics {
    adSales: number;
    adSpend: number;
    acos: number;
    roas: number;
    orders: number;
    units: number;
    cvr: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
}

// 2. The Root: Product Catalog (The "Amazon Inventory")
export interface Product {
    asin: string;
    sku: string;
    name: string;
    price: number;
    imageUrl: string;
    parentAsin?: string; // For variations
}

// 3. Campaign (The Parent)
export interface Campaign extends Metrics {
    id: string;
    storeId: string;
    name: string;
    adType: 'SP' | 'SB' | 'SD';
    status: 'ENABLED' | 'PAUSED' | 'ARCHIVED';
    dailyBudget: number;
    targetingType?: 'MANUAL' | 'AUTO'; // SP only
    biddingStrategy?: 'Dynamic Down' | 'Dynamic Up/Down' | 'Fixed'; // SP only
    costType?: 'CPC' | 'vCPM'; // SB/SD
    portfolioId?: string;
    startDate: string;
}

// 4. Ad Group (The Child)
export interface AdGroup extends Metrics {
    id: string;
    campaignId: string;
    name: string;
    status: 'ENABLED' | 'PAUSED' | 'ARCHIVED';
    defaultBid: number;
    // SB Specific
    adFormat?: 'Product Collection' | 'Store Spotlight' | 'Video'; 
}

// 5. Targeting (Keywords/Targets/Audiences)
export interface Targeting extends Metrics {
    id: string;
    adGroupId: string;
    campaignId: string;
    type: 'KEYWORD' | 'PRODUCT' | 'AUDIENCE';
    value: string; // The keyword text or ASIN
    matchType?: 'BROAD' | 'PHRASE' | 'EXACT' | 'negative';
    bid: number;
    status: 'ENABLED' | 'PAUSED' | 'ARCHIVED';
}