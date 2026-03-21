export interface BudgetingGroupData {
  id: string;
  enabled: boolean;
  name: string;
  storeFlag: string;
  storeName: string;
  statusText: string; // e.g. "Enabled", "Paused" displayed below name
  
  ruleType?: string; // e.g., "Auto-Budgeting"
  
  budget: number;
  budgetIssue?: string; // e.g. "Budget required", "Out of budget"

  campaignCount?: number;

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

// Start empty to trigger Empty State
export const MOCK_BUDGETING_GROUPS: BudgetingGroupData[] = [];