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
  status: boolean; // true = enabled
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
  // Goal Setup
  storeId: string;
  setStoreId: (id: string) => void;
  goalName: string;
  setGoalName: (name: string) => void;
  adType: string;
  setAdType: (type: string) => void;

  // Product Selection
  selectedProducts: any[];
  setSelectedProducts: (products: any[]) => void;

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
}

const CampaignBuilderContext = createContext<CampaignBuilderState | undefined>(undefined);

export function CampaignBuilderProvider({ children }: { children: React.ReactNode }) {
  const [storeId, setStoreId] = useState(''); // Default empty, user must select
  const [goalName, setGoalName] = useState('');
  const [adType, setAdType] = useState('Sponsored Products');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [strategy, setStrategy] = useState('Basic');
  const [competingCampaigns, setCompetingCampaigns] = useState<CompetingRow[]>([]);

  const [brandedPhrases, setBrandedPhrases] = useState<string[]>([]);
  const [competitorPhrases, setCompetitorPhrases] = useState<string[]>([]);

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

  return (
    <CampaignBuilderContext.Provider value={{
      storeId, setStoreId,
      goalName, setGoalName,
      adType, setAdType,
      selectedProducts, setSelectedProducts,
      strategy, setStrategy,
      competingCampaigns, setCompetingCampaigns,
      brandedPhrases, setBrandedPhrases,
      competitorPhrases, setCompetitorPhrases,
      customConfig, setCustomConfig
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