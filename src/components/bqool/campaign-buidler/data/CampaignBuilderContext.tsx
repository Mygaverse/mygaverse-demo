'use client';
import React, { createContext, useContext, useState } from 'react';

// Define the shape of a Competing Row based on your table columns
export interface CompetingRow {
  id: string;
  productName: string;
  productImage: string;
  asin: string;
  sku: string;
  competingAdGroup: string;
  competingCampaign: string;
  storeName?: string;
  storeFlag?: string;
  status: boolean; // true = enabled
}

export interface SDTarget {
  id: string;
  type: 'contextual' | 'remarketing' | 'audiences';
  subType?: 'in-market' | 'lifestyle';
  targetValue: string; // ASIN, Segment Name, etc.
  filterBy: string;    // Exact, Expanded, 30 Days, Category, etc.
  bid: number;
  lookback?: string;
}

// Define Custom Config Structure
export interface CustomStrategyConfig {
  mode: 'auto' | 'manual';

  // Auto Mode Data
  autoGroups: { id: string; label: string; enabled: boolean; bid: number }[];

  // Manual Mode Data
  manualType: 'keyword' | 'product';
  addedKeywords: { id: string; text: string; type: string; bid: number }[];
  addedProducts: { id: string; text: string; type: string; bid: number }[];
}

interface CampaignBuilderState {
  // Store Selection
  storeId: string;
  setStoreId: (id: string) => void;
  selectedStore: { name: string; marketplace: string } | null;
  setSelectedStore: (store: { name: string; marketplace: string } | null) => void;

  goalName: string;
  setGoalName: (name: string) => void;
  adType: string;
  setAdType: (type: string) => void;

  // Product Selection
  selectedProducts: any[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<any[]>>;

  // Strategy
  strategy: string;
  setStrategy: (strat: string) => void;
  customConfig: CustomStrategyConfig;
  setCustomConfig: (config: CustomStrategyConfig) => void;

  // Competing Campaigns State
  competingCampaigns: CompetingRow[];
  setCompetingCampaigns: (campaigns: CompetingRow[]) => void;

  // Phrase State for Brand-Based Strategy
  brandedPhrases: string[];
  setBrandedPhrases: (phrases: string[]) => void;
  competitorPhrases: string[];
  setCompetitorPhrases: (phrases: string[]) => void;

  // New SB Specific State
  brandName: string[];
  setBrandName: (names: string[]) => void;
  competitorAsins: string[];
  setCompetitorAsins: (asins: string[]) => void;

  // Ad Format & Creatives
  adFormat: 'product-collection' | 'video' | 'store-spotlight';
  setAdFormat: (format: 'product-collection' | 'video' | 'store-spotlight') => void;
  landingPage: { source: string; name: string; subpages: string[] };
  setLandingPage: (lp: { source: string; name: string; subpages: string[] }) => void;
  creatives: {
    logo: string;
    brandName: string;
    headline: string;
    images: string[];
    video: string | null;
    toggles: { logo: boolean; headline: boolean; media: boolean };
  };
  setCreatives: (c: {
    logo: string;
    brandName: string;
    headline: string;
    images: string[];
    video: string | null;
    toggles: { logo: boolean; headline: boolean; media: boolean };
  }) => void;

  // SD Specific Targeting
  sdTargeting: SDTarget[];
  setSdTargeting: (targets: SDTarget[]) => void;
}

const CampaignBuilderContext = createContext<CampaignBuilderState | undefined>(undefined);

export function CampaignBuilderProvider({ children }: { children: React.ReactNode }) {
  const [storeId, setStoreId] = useState(''); // Default empty, user must select
  const [selectedStore, setSelectedStore] = useState<{ name: string; marketplace: string } | null>(null);
  const [goalName, setGoalName] = useState('');
  const [adType, setAdType] = useState('Sponsored Products');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [strategy, setStrategy] = useState('Basic');
  const [competingCampaigns, setCompetingCampaigns] = useState<CompetingRow[]>([]);

  const [brandedPhrases, setBrandedPhrases] = useState<string[]>([]);
  const [competitorPhrases, setCompetitorPhrases] = useState<string[]>([]);

  // SB Specific
  const [brandName, setBrandName] = useState<string[]>([]);
  const [competitorAsins, setCompetitorAsins] = useState<string[]>([]);

  // Initialize Custom Config with defaults
  const [customConfig, setCustomConfig] = useState<CustomStrategyConfig>({
    mode: 'auto',
    autoGroups: [
      { id: 'close', label: 'Close match', enabled: true, bid: 1.00 },
      { id: 'loose', label: 'Loose match', enabled: true, bid: 1.00 },
      { id: 'sub', label: 'Substitutes', enabled: true, bid: 1.00 },
      { id: 'comp', label: 'Complements', enabled: true, bid: 1.00 },
    ],
    manualType: 'keyword',
    addedKeywords: [],
    addedProducts: []
  });

  // Ad Format & Creatives
  const [adFormat, setAdFormat] = useState<'product-collection' | 'video' | 'store-spotlight'>('product-collection');
  const [landingPage, setLandingPage] = useState({ source: 'Amazon Store', name: 'TeststoreABC', subpages: ['Home'] });
  const [creatives, setCreatives] = useState<{
    logo: string;
    brandName: string;
    headline: string;
    images: string[];
    video: string | null;
    toggles: { logo: boolean; headline: boolean; media: boolean };
  }>({
    logo: '',
    brandName: 'TestStoreABC',
    headline: '',
    images: [],
    video: null,
    toggles: { logo: true, headline: true, media: true }
  });

  const [sdTargeting, setSdTargeting] = useState<SDTarget[]>([]);

  // Handle Strategy Reset when Ad Type changes
  React.useEffect(() => {
    if (adType === 'Sponsored Brands') {
      setStrategy('Brand Awareness');
    } else if (adType === 'Sponsored Display') {
      setStrategy('Remarketing');
    } else if (adType === 'Sponsored Products') {
      setStrategy('Basic');
    }
  }, [adType]);

  return (
    <CampaignBuilderContext.Provider value={{
      storeId, setStoreId,
      selectedStore, setSelectedStore,
      goalName, setGoalName,
      adType, setAdType,
      selectedProducts, setSelectedProducts,
      strategy, setStrategy,
      competingCampaigns, setCompetingCampaigns,
      brandedPhrases, setBrandedPhrases,
      competitorPhrases, setCompetitorPhrases,
      brandName, setBrandName,
      competitorAsins, setCompetitorAsins,
      customConfig, setCustomConfig,
      adFormat, setAdFormat,
      landingPage, setLandingPage,
      creatives, setCreatives,
      sdTargeting, setSdTargeting
    }}>
      {children}
    </CampaignBuilderContext.Provider>
  );
}

export const useCampaignBuilder = () => {
  const context = useContext(CampaignBuilderContext);
  if (!context) throw new Error("useCampaignBuilder must be used within a CampaignBuilderProvider");
  return context;
};
