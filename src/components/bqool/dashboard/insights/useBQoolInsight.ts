'use client';

import { useState, useEffect, useCallback } from 'react';
import genAI from '@/lib/bqool/gemini';
import { UnifiedCampaign, UnifiedSearchTerm, UnifiedTargeting, UnifiedProductAd } from '@/components/bqool/ad-manager/data/unifiedAdManagerData';

export type InsightCategory = 'Good Trend' | 'Possible Trend' | 'Caution Terms';
export type InsightTab = 'campaigns' | 'targeting' | 'asins';

export interface Insight {
    category: InsightCategory;
    message: string;
    cta: string;
    targetPage: string;
    metric?: string;
    campaignName?: string;
}

export interface SummarySection {
    metricSummary: string;
    chartAnalysis: string;
    entityPerformance: {
        top: string;
        worst: string;
    };
}

export interface AIResponse {
    summary: SummarySection;
    insights: Insight[];
}

interface UseBQoolInsightProps {
    campaigns: UnifiedCampaign[];
    searchTerms: UnifiedSearchTerm[];
    targeting: UnifiedTargeting[];
    productAds: UnifiedProductAd[];
    stats: any[];
    activeTab: InsightTab;
}

export function useBQoolInsight({ campaigns, searchTerms, targeting, productAds, stats, activeTab }: UseBQoolInsightProps) {
    const [data, setData] = useState<AIResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = useCallback(async (forceRefresh = false) => {
        if (campaigns.length === 0) return;

        const cacheKey = `bqool_insight_cache_v3_${activeTab}`;
        if (!forceRefresh) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    setData(JSON.parse(cached));
                    return;
                } catch (e) {
                    console.error("Cache parse error", e);
                    localStorage.removeItem(cacheKey);
                }
            }
        }

        setLoading(true);
        setError(null);
        setData(null);

        try {
            // --- Shared KPI Summary ---
            const totalSpend = stats.reduce((sum, s) => sum + s.spend, 0);
            const totalSales = stats.reduce((sum, s) => sum + s.sales, 0);
            const totalImpressions = stats.reduce((sum, s) => sum + s.impressions, 0);
            const totalClicks = stats.reduce((sum, s) => sum + s.clicks, 0);
            const roas = totalSpend > 0 ? totalSales / totalSpend : 0;
            const acos = totalSales > 0 ? (totalSpend / totalSales) * 100 : 0;
            const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
            const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

            const dailyTrend = stats.map(s => ({
                date: s.date,
                spend: s.spend,
                sales: s.sales,
                roas: s.spend > 0 ? s.sales / s.spend : 0
            })).slice(-14);

            const kpis = {
                spend: totalSpend.toFixed(2),
                sales: totalSales.toFixed(2),
                roas: roas.toFixed(2),
                acos: acos.toFixed(2) + '%',
                ctr: ctr.toFixed(2) + '%',
                cpc: cpc.toFixed(2)
            };

            // --- Tab-specific payload ---
            let entityPayload: any = {};
            let entityFocus = '';
            let featureMap = '';

            if (activeTab === 'campaigns') {
                const sorted = [...campaigns].sort((a, b) => b.spend - a.spend);
                entityPayload = {
                    topSpenders: sorted.slice(0, 5).map(c => ({
                        name: c.name, spend: c.spend, sales: c.sales,
                        roas: c.spend > 0 ? c.sales / c.spend : 0, acos: c.acos, status: c.status
                    })),
                    potentialWinners: campaigns.filter(c => c.sales > 100 && (c.spend > 0 ? c.sales / c.spend : 0) > 4).slice(0, 3).map(c => c.name),
                    potentialLosers: campaigns.filter(c => c.spend > 50 && (c.sales === 0 || (c.sales / c.spend) < 2)).slice(0, 3).map(c => c.name),
                    totalCampaigns: campaigns.length
                };
                entityFocus = 'campaign-level performance. Name specific campaigns in all outputs.';
                featureMap = `
- **Optimizing Bids/Keywords**: \`/bqool/ad-manager?tab=Campaigns&search=[CampaignName]\`
- **Budget Issues**: \`/bqool/budget-manager\`
- **Scaling/New**: \`/bqool/campaign-builder\``;
            }

            if (activeTab === 'targeting') {
                const sorted = [...targeting].sort((a, b) => b.spend - a.spend);
                const top5 = sorted.slice(0, 5).map(t => ({
                    keyword: (t as any).keyword || (t as any).expression || 'Unknown',
                    matchType: (t as any).matchType,
                    spend: t.spend, sales: t.sales,
                    acos: t.sales > 0 ? (t.spend / t.sales) * 100 : 0,
                    roas: t.spend > 0 ? t.sales / t.spend : 0
                }));
                const bottom5 = [...targeting]
                    .filter(t => t.spend > 10 && t.sales === 0)
                    .slice(0, 5)
                    .map(t => ({ keyword: (t as any).keyword || (t as any).expression || 'Unknown', spend: t.spend }));

                entityPayload = { topTargeting: top5, wastedTargeting: bottom5, total: targeting.length };
                entityFocus = 'targeting/keyword-level performance. Name specific keywords or expressions in all outputs.';
                featureMap = `
- **Add Negatives / Refine Keywords**: \`/bqool/ad-manager?tab=Targeting\`
- **Search Term Harvesting**: \`/bqool/ad-manager?tab=Search Terms\``;
            }

            if (activeTab === 'asins') {
                const sorted = [...productAds].sort((a, b) => b.spend - a.spend);
                const top5 = sorted.slice(0, 5).map(p => ({
                    asin: (p as any).asin || p.id,
                    sku: (p as any).sku,
                    spend: p.spend, sales: p.sales,
                    acos: p.sales > 0 ? (p.spend / p.sales) * 100 : 0,
                    roas: p.spend > 0 ? p.sales / p.spend : 0
                }));
                const bottom5 = [...productAds]
                    .filter(p => p.spend > 10 && p.sales === 0)
                    .slice(0, 5)
                    .map(p => ({ asin: (p as any).asin || p.id, spend: p.spend }));

                entityPayload = { topASINs: top5, wastedASINs: bottom5, total: productAds.length };
                entityFocus = 'ASIN/product-level performance. Name specific ASINs in all outputs.';
                featureMap = `
- **Product Ad Optimization**: \`/bqool/ad-manager?tab=Product Ads\`
- **Campaign Builder**: \`/bqool/campaign-builder\``;
            }

            const payload = { period: "Last 14 Days", kpis, trends: dailyTrend, ...entityPayload };

            // --- Construct Prompt ---
            const tabLabel = activeTab === 'asins' ? 'ASINs' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
            const prompt = `
You are an expert Amazon Ads Analyst & BQool Product Specialist.
Analyze the provided ad performance data and generate an executive report focused on ${entityFocus}

### DATA CONTEXT
${JSON.stringify(payload, null, 2)}

### BQOOL FEATURE MAP (Use for targetPage values)
${featureMap}
- **General**: \`/bqool/v2/dashboard\`

### OUTPUT REQUIREMENTS

1. **Summary** — 3 separate fields:
   - **metricSummary**: 1–2 sentences on overall KPI health for the ${tabLabel} tab (use specific numbers).
   - **chartAnalysis**: 1–2 sentences on 14-day trend patterns (e.g. "Spend spiked Tuesday while sales stayed flat").
   - **entityPerformance**:
     - **top**: Best performing ${tabLabel.slice(0, -1) || tabLabel} name + key metric (e.g. "Gaming Headsets — ROAS 5.2")
     - **worst**: Worst performing ${tabLabel.slice(0, -1) || tabLabel} name + key metric (e.g. "Wireless Gadgets — ACOS 72%")

2. **Insights (Exactly 3 Items)** focused on ${entityFocus}:
   - **Good Trend**: High ROAS (>4), Low ACOS (<30%). Action: Scale, increase budget.
   - **Possible Trend**: High impressions/clicks, low conversion. Action: Refine targeting, add negatives.
   - **Caution Terms**: High spend/zero sales, ACOS >60%. Action: Lower bids, pause, add negatives.

### JSON OUTPUT FORMAT ONLY
{
  "summary": {
    "metricSummary": "...",
    "chartAnalysis": "...",
    "entityPerformance": {
      "top": "Name — Key Metric",
      "worst": "Name — Key Metric"
    }
  },
  "insights": [
    {
      "category": "Good Trend" | "Possible Trend" | "Caution Terms",
      "message": "Specific finding about a named ${tabLabel.slice(0, -1) || tabLabel}.",
      "cta": "Short Action",
      "targetPage": "/valid-path",
      "metric": "Key Metric (e.g. 'ROAS 5.2')",
      "campaignName": "Exact entity name if applicable, else null"
    }
  ]
}
            `;

            const response = await genAI.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            const text = response.text || "";
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            if (!cleanedText) throw new Error("Empty response from AI");

            const parsedData = JSON.parse(cleanedText) as AIResponse;
            localStorage.setItem(cacheKey, JSON.stringify(parsedData));
            setData(parsedData);

        } catch (err) {
            console.error("Gemini Client Error:", err);
            setError("Failed to generate insights.");
        } finally {
            setLoading(false);
        }
    }, [campaigns, targeting, productAds, stats, activeTab]);

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    return {
        summary: data?.summary,
        insights: data?.insights || [],
        loading,
        error,
        refetch: () => fetchInsights(true)
    };
}
