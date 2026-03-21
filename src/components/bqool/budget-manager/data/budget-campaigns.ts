import { BudgetingGroupData } from "./budgeting-groups";

export interface BudgetCampaignData {
    id: string;
    name: string;
    storeFlag: string;
    storeName: string;
    adType: string; // 'SP Manual', 'SB', etc.
    status: string; // 'Enabled', 'Paused'
    
    // Link back to Budgeting Group
    budgetingGroupName: string;
    budgetingGroupId: string;
    budgetingGroupStatus: string;
    
    productCount: number;
    dailyBudget: string;
    
    // Metrics
    adSales: string;
    adSpend: string;
    acos: string;
    roas: string;
    orders: string;
    units: string;
    cvr: string;
    impressions: string;
    clicks: string;
    ctr: string;
    cpc: string;
}

// Helper to generate campaigns based on current groups
export const generateCampaignsFromGroups = (groups: BudgetingGroupData[]): BudgetCampaignData[] => {
    const campaigns: BudgetCampaignData[] = [];

    groups.forEach((group, groupIndex) => {
        // Generate 2-4 campaigns per group for the demo
        const count = 2 + (groupIndex % 3);
        
        for (let i = 0; i < count; i++) {
            campaigns.push({
                id: `cmp-${group.id}-${i}`,
                name: `SP_${group.name.substring(0, 15)}..._Campaign_${i+1}`,
                storeFlag: group.storeFlag,
                storeName: group.storeName,
                adType: i % 2 === 0 ? 'SP Manual' : 'SB',
                status: i === 0 ? 'Enabled' : 'Paused',
                
                budgetingGroupName: group.name,
                budgetingGroupId: group.id,
                budgetingGroupStatus: group.statusText,
                
                productCount: 5 + i,
                dailyBudget: `$${(group.budget / count).toFixed(2)}`,
                
                // Mock Metrics (varied slightly from group)
                adSales: "$450.00",
                adSpend: "$45.00",
                acos: "10%",
                roas: "10.00",
                orders: "12",
                units: "15",
                cvr: "8.5%",
                impressions: "1,200",
                clicks: "80",
                ctr: "6.5%",
                cpc: "$0.56"
            });
        }
    });

    return campaigns;
};