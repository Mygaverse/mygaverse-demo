// --- STRATEGY CARDS ---
export const STRATEGY_OPTIONS = [
    { id: 'Basic', title: 'Basic', icon: '🎯', desc: 'Broadest multi-campaign goal structure. Launches Auto + Manual campaigns.', bestFor: ['No brand recognition', 'New products'] },
    { id: 'Advanced', title: 'Advanced', icon: '🏆', desc: 'Invest more in high-performing targets. Separate manual campaign with addt budget.', bestFor: ['Ample campaign data', 'High conversion targets'] },
    { id: 'Brand-Based', title: 'Brand-Based', icon: '🔎', desc: 'Ideal for products with significant branded search demand.', bestFor: ['Established brand', 'Specific competitors'] },
    { id: 'Custom', title: 'Custom', icon: '🖥️', desc: 'Build one campaign and not follow BQool structure.', bestFor: ['Experienced advertisers', 'Specific strategies'] },
];

// --- PREVIEW TABLE DATA ---
export interface PreviewRow {
    id: string;
    goalName: string;
    campaignName: string;
    storeFlag: string;
    budget: number;
    aiBidding: boolean;
    autoHarvesting: boolean;
}

export const MOCK_PREVIEW_DATA: PreviewRow[] = [
    { id: '1', goalName: 'Custom Campaign for Mobile...', campaignName: 'SP_B0C3VB_Phone_Lanyard', storeFlag: 'us', budget: 10.00, aiBidding: true, autoHarvesting: false },
    { id: '2', goalName: 'Custom Campaign for Mobile...', campaignName: 'SP_B0C3VB_Case_Cover', storeFlag: 'us', budget: 15.00, aiBidding: true, autoHarvesting: true },
];

// --- COMPETING TABLE DATA ---
export interface CompetingRow {
    id: string;
    productImage: string;
    productName: string;
    sku: string;
    asin: string;
    competingAdGroup: string;
    competingCampaign: string;
    status: boolean;
}

export const MOCK_COMPETING_DATA: CompetingRow[] = [
    { 
        id: '1', productImage: 'https://placehold.co/40x40/png?text=P1', 
        productName: '[Green] Lawonda 2 Pads Phone Lanyard', sku: '330FCDB3-970', asin: 'B00BW6KCTU',
        competingAdGroup: 'B0C3VB4P78_Broad', competingCampaign: 'SP_B0C3VB4P78_Phone Lanyard', status: false
    },
    { 
        id: '2', productImage: 'https://placehold.co/40x40/png?text=P2', 
        productName: '[Purple] Lawonda 2 Pads Phone Lanyard', sku: '330FCDB3-971', asin: 'B00BW6KCTV',
        competingAdGroup: 'B0C3VB4P56_Exact', competingCampaign: 'SP_B0C3VB4P56_Phone Lanyard', status: false
    }
];

// --- MOCK DATA for Product Selection Section ---

export interface Product {
    id: string;
    name: string;
    asin: string;
    sku: string;
    image: string;
    parentAsin: string; // Key for grouping
    parentName: string; // Display name for parent header
}

export interface ParentProduct {
    id: string;
    name: string;
    asin: string;
    sku: string;
    children: Product[];
}

// Single Source of Truth: Flat list of products
export const MOCK_SEARCH_RESULTS: Product[] = [
    { 
        id: 'c1', name: '[Green] Lawonda 2 Pads Phone Lanyard Adjustable', asin: 'B00BW6KCTU', sku: 'PLS-GRN-01', image: 'https://placehold.co/40x40/png?text=P1',
        parentAsin: 'B00PARENT1', parentName: 'Lanyard Adjustable Crossbody Cell Phone Strap Universal Phone Wrist Lanyard 2pcs Phone Patch ...' 
    },
    { 
        id: 'c2', name: '[Purple] Lawonda 2 Pads Phone Lanyard Adjustable', asin: 'B0C3VB4P78', sku: 'PLS-PUR-02', image: 'https://placehold.co/40x40/png?text=P2',
        parentAsin: 'B00PARENT1', parentName: 'Lanyard Adjustable Crossbody Cell Phone Strap Universal Phone Wrist Lanyard 2pcs Phone Patch ...'
    },
    { 
        id: 'c3', name: '[Gray] Lawonda 2 Pads Phone Lanyard Adjustable', asin: 'B0C3VB4P99', sku: 'PLS-GRY-03', image: 'https://placehold.co/40x40/png?text=P3',
        parentAsin: 'B00PARENT2', parentName: 'Heavy Duty Phone Loop Finger Holder (3 Pack) - Silicon'
    },
    { 
        id: 'c4', name: '[Black] Crossbody Cell Phone Strap Universal', asin: 'B0C3VB4P00', sku: 'PLS-BLK-04', image: 'https://placehold.co/40x40/png?text=P4',
        parentAsin: 'B00PARENT2', parentName: 'Heavy Duty Phone Loop Finger Holder (3 Pack) - Silicon'
    },
];

// Mock Product Data
export const MOCK_PRODUCTS = [
    { id: '1', name: 'Lanyard Adjustable Crossbody Cell Phone Strap', asin: 'B00BW6KCTU', image: 'https://placehold.co/40x40/png?text=P1' },
    { id: '2', name: 'Universal Phone Wrist Lanyard 2pcs', asin: 'B0C3VB4P78', image: 'https://placehold.co/40x40/png?text=P2' },
    { id: '3', name: 'Phone Patch Tether Tab Replacement', asin: 'B0C3VB4P99', image: 'https://placehold.co/40x40/png?text=P3' },
];