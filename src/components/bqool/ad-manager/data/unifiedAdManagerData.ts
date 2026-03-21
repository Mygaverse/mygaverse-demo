// app/demo/types/advertising.ts

// ==========================================
// 1. SHARED METRICS (The Foundation)
// ==========================================
export interface BaseMetrics {
  sales: number;
  spend: number;
  impressions: number;
  clicks: number;
  orders: number;
  units: number;

  // Computed Metrics
  acos: number; // %
  roas: number; // x
  ctr: number;  // %
  cvr: number;  // %
  cpc: number;  // $
}

// ==========================================
// 2. TYPE-SPECIFIC FIELDS (Separated)
// ==========================================

// Fields ONLY found in Sponsored Brands
export interface SBUniqueMetrics {
  ntbOrders?: number; // New-To-Brand Orders
  ntbSales?: number;  // New-To-Brand Sales
}

// Fields ONLY found in Sponsored Display
export interface SDUniqueMetrics {
  viewableImpressions?: number;
  vctr?: number; // Viewable CTR
}

// Composite Types for convenience
export interface SBMetrics extends BaseMetrics, SBUniqueMetrics { }
export interface SDMetrics extends BaseMetrics, SDUniqueMetrics { }

// ==========================================
// 3. DAILY STATISTICS (For Charts)
// ==========================================
export interface DailyStat extends BaseMetrics {
  date: string;       // YYYY-MM-DD
  entityId: string;   // ID of the Campaign/AdGroup/Target
  entityName: string;
}

// ==========================================
// 4. UNIFIED ENTITIES
// ==========================================

export type AdType = 'SP' | 'SB' | 'SD';

// --- CAMPAIGNS ---
// Fix: We extend Partial<UniqueMetrics> instead of Partial<SBMetrics> to avoid 'sales' conflict
export interface UnifiedCampaign extends BaseMetrics, Partial<SBUniqueMetrics>, Partial<SDUniqueMetrics> {
  id: string;
  storeId: string;
  name: string;
  type: AdType;
  enabled: boolean;
  status: string; // Added status
  storeName: string;
  flag: string;

  // Budget & Settings
  budget: number;
  budgetType?: 'Daily' | 'Lifetime';
  autoBudget: boolean;
  portfolio?: string;
  costType?: 'CPC' | 'vCPM';

  // NEW FIELD: Link to Budget Group
  budgetGroupId?: string;

  // Context
  goalName?: string;
  goalStatus?: string;

  // Sub-collection references (for internal use if needed)
  lastUpdated?: any;

  // Ownership (For User Isolation)
  createdBy?: string;
  creatorName?: string;
  createdAt?: string;
}


// --- AD GROUPS ---
export interface UnifiedAdGroup extends BaseMetrics {
  id: string;
  storeId: string;
  name: string;
  enabled: boolean;
  status: string; // Added status
  campaignId: string;
  campaignName: string;
  type: AdType;

  // Bids & AI
  defaultBid: number;
  aiBiddingEnabled: boolean;
  aiBiddingStrategy?: 'Manual Target ACOS' | 'AI Optimized';
  targetAcos?: number | null;
  autoHarvestingEnabled?: boolean;

  // --- TYPE-SPECIFIC SPECS ---
  adFormat?: string;             // For SB/SD (e.g. "Video", "Product Collection")
  optimizationStrategy?: string; // For SD (e.g. "Page Visits", "Conversions")
  targetingType?: string;        // For SD (e.g. "Contextual", "Audiences")

  // Context
  storeName: string;
  flag: string;
  goalName?: string;
  goalType?: 'Basic' | 'Advanced' | 'Brand-based';
  portfolio?: string;

  // Ownership
  createdBy?: string;
  creatorName?: string;
}


// --- PRODUCT ADS ---
export interface UnifiedProductAd extends BaseMetrics {
  id: string;
  storeId: string;
  enabled: boolean;

  // Product Info (SP/SD)
  productName?: string;
  productImage?: string;
  asin?: string;
  sku?: string;

  // SB Specific
  adFormat?: string; // "Video", "Product Collection", etc.
  sbAdText?: string; // "Product collection ad - 11/29/2023..."

  // Hierarchy Linkage
  adGroupId: string;
  adGroupName: string;
  adGroupStatus?: string; // 'Enabled' | 'Paused' | 'Archived'

  campaignId: string;
  campaignName: string;
  campaignType: AdType;
  campaignStatus?: string; // 'Enabled' | 'Paused' | 'Archived'

  // Context
  storeName: string;
  flag: string;
  goalName?: string;
  goalStatus?: string;

  // Ownership
  createdBy?: string;
  creatorName?: string;
}


// --- TARGETING (Keywords & Targets) ---
export interface UnifiedTargeting extends BaseMetrics, Partial<SBUniqueMetrics> {
  id: string;
  storeId: string;
  enabled: boolean;
  status: string; // Added status

  // Targeting Details
  targetingText: string;
  matchType?: string;
  targetType?: string;
  targetDetails?: string;

  // Bidding
  bid: number;
  minBid?: number | null;
  maxBid?: number | null;

  // Hierarchy
  adGroupId: string;
  adGroupName: string;
  adGroupStatus?: string;

  campaignId: string;
  campaignName: string;
  campaignType: AdType;
  campaignStatus?: string;

  // Context
  storeName: string;
  flag: string;
  goalName?: string;
  goalStatus?: string;

  isAutoHarvested?: boolean;

  // Ownership
  createdBy?: string;
  creatorName?: string;
}


// --- SEARCH TERMS ---
export interface UnifiedSearchTerm extends BaseMetrics {
  id: string;
  storeId: string;
  searchTerm: string;

  // Hierarchy
  adGroupId: string;
  adGroupName: string;
  adGroupStatus: string;

  campaignId: string;
  campaignName: string;
  campaignType: AdType;
  campaignStatus: string;

  // Search Term Specifics
  addedAsTypes: string[]; // ['Keyword', 'Negative Keyword']
  isAutoHarvested: boolean;

  // Source Target
  targetingText: string;
  targetingType?: string;
  targetingBid?: number;
  targetingStatus?: string;

  // Context
  storeName: string;
  flag: string;
  goalName?: string;
  goalStatus?: string;

  // Ownership
  createdBy?: string;
  creatorName?: string;
}


// --- GOALS ---
// Fix: Added 'extends BaseMetrics' so it supports sales, spend, etc.
export interface UnifiedGoal extends BaseMetrics {
  id: string;
  name: string;
  storeId: string;
  goalType: 'Basic' | 'Advanced' | 'Brand-based';
  targetAcos: number;
  status: 'Active' | 'Paused';

  // Counters
  campaignCount: number;
  adCount: number;

  // Ownership (For User Isolation)
  createdBy?: string;
  creatorName?: string;
  createdAt?: string;
}


// ==========================================
// 5. BUDGET MANAGER SUPPORT
// ==========================================
export type RuleCondition = 'ROAS' | 'ACOS' | 'Spend' | 'Impressions';
export type RuleAction = 'Increase' | 'Decrease' | 'Pause';

export interface BudgetRule {
  id: string;
  storeId: string;
  campaignId: string; // The campaign this rule applies to
  campaignName: string;
  name: string;       // e.g., "Scale Winners"
  conditionMetric: RuleCondition;
  conditionOperator: '>' | '<';
  conditionValue: number;
  action: RuleAction;
  actionValue: number; // e.g., 20 (percent) or 5 (dollars)
  isEnabled: boolean;
  lastRun?: string;    // ISO Date
}

// ==========================================
// 6. AD HISTORY SUPPORT
// ==========================================
export interface HistoryLog {
  id: string;
  storeId: string;
  entityId: string;   // Campaign/AdGroup/Keyword ID
  entityName: string;
  entityType: 'Campaign' | 'AdGroup' | 'Targeting' | 'ProductAd';
  changeType: 'Bid' | 'Budget' | 'Status' | 'Strategy';
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
  timestamp: string;  // ISO Date
  user: string;       // e.g., "System (AI)" or "User"
}