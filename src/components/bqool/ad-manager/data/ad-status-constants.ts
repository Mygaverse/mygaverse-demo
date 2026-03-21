// Shared Options for Ad Status Dropdown
export const GOALS_OPTIONS = [
  { id: 'all', label: 'All' },
];

export const CAMPAIGNS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'all_campaign_status', label: 'All Campaign Status' },
  { id: 'campaign_enabled', label: 'Campaign Enabled', parentId: 'all_campaign_status' },
  { id: 'campaign_paused', label: 'Campaign Paused', parentId: 'all_campaign_status' },
  { id: 'campaign_archived', label: 'Campaign Archived', parentId: 'all_campaign_status' },
  { id: 'all_ad_group_status', label: 'All Ad Group Status' },
  { id: 'ad_group_enabled', label: 'Ad Group Enabled', parentId: 'all_ad_group_status' },
  { id: 'ad_group_paused', label: 'Ad Group Paused', parentId: 'all_ad_group_status' },
  { id: 'ad_group_archived', label: 'Ad Group Archived', parentId: 'all_ad_group_status' },
];

export const AD_GROUP_STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'all_status', label: 'All Ad Group Status' },
  { id: 'enabled', label: 'Ad Group Enabled', parentId: 'all_status' },
  { id: 'paused', label: 'Ad Group Paused', parentId: 'all_status' },
  { id: 'archived', label: 'Ad Group Archived', parentId: 'all_status' },
];

export const PRODUCT_AD_STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'all_status', label: 'All Product Ad Status' },
  { id: 'enabled', label: 'Product Ads Enabled', parentId: 'all_status' },
  { id: 'paused', label: 'Product Ads Paused', parentId: 'all_status' },
  { id: 'archived', label: 'Product Ads Archived', parentId: 'all_status' },
];

export const TARGETING_STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'all_status', label: 'All Targeting Status' },
  { id: 'enabled', label: 'Targeting Enabled', parentId: 'all_status' },
  { id: 'paused', label: 'Targeting Paused', parentId: 'all_status' },
  { id: 'archived', label: 'Targeting Archived', parentId: 'all_status' },
];

export const SEARCH_TERM_STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'all_status', label: 'All Status' },
  { id: 'added', label: 'Added', parentId: 'all_status' },
  { id: 'not_added', label: 'Not Added', parentId: 'all_status' },
  { id: 'excluded', label: 'Excluded', parentId: 'all_status' },
];

// Shared Options for Search Types (Base options)
export const SEARCH_TYPE_OPTIONS = {
  CAMPAIGN: [
    'Search by Campaign', 
    'Search by Portfolio', 
    'Search by Ad Group'
  ],
  GOAL: [
    'Search by Goals', 
    'Search by Campaign', 
    'Search by Product Ads ASIN', 
    'Search by Product Ads SKU'
  ],
  AD_GROUP: [ 
    'Search by Ad Group', 
    'Search by Campaigns', 
    'Search by Portfolio' 
  ],
  PRODUCT_AD: [ 
    'Search by Product Ads ASIN', 
    'Search by Product Ads SKU', 
    'Search by Campaigns', 
    'Search by Ad Group' 
  ],
  TARGETING: [ 
    'Search by Targeting Keyword', 
    'Search by Campaigns', 
    'Search by Ad Group' 
  ],
  SEARCH_TERM: [ 
    'Search by Search Terms', 
    'Search by Campaigns', 
    'Search by Ad Group', 
    'Search by Targeting' 
  ]
};