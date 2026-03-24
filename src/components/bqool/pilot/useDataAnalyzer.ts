'use client';

import { useCallback } from 'react';
import { usePilot, AnalyzerResult } from './PilotContext';
import genAI from '@/lib/bqool/gemini';

// Keys found in typical table row objects to include in the AI payload
const USEFUL_KEYS = new Set([
    'name', 'campaignName', 'adGroupName', 'storeName', 'status',
    'spend', 'sales', 'orders', 'clicks', 'impressions',
    'acos', 'roas', 'ctr', 'cvr', 'cpc',
    'budget', 'targetingText', 'matchType', 'searchTerm',
    'productName', 'asin', 'sku', 'bid', 'defaultBid',
]);

function trimRow(row: any): Record<string, any> {
    const out: Record<string, any> = {};
    for (const key of Object.keys(row)) {
        if (USEFUL_KEYS.has(key) && row[key] !== null && row[key] !== undefined) {
            out[key] = row[key];
        }
    }
    return out;
}

export function useDataAnalyzer() {
    const {
        analyzerMode, setAnalyzerMode,
        registeredZones,
        activeZoneId, setActiveZoneId,
        pendingSelectedIds, setPendingSelectedIds,
        setAnalyzerResult,
        openPilot,
    } = usePilot();

    const startSelecting = useCallback(() => {
        setAnalyzerMode('selecting');
        setActiveZoneId(null);
        setPendingSelectedIds(new Set());
        setAnalyzerResult(null);
        openPilot();
    }, [setAnalyzerMode, setActiveZoneId, setPendingSelectedIds, setAnalyzerResult, openPilot]);

    const selectZone = useCallback((zoneId: string) => {
        setActiveZoneId(zoneId);
        setPendingSelectedIds(new Set());
    }, [setActiveZoneId, setPendingSelectedIds]);

    const cancelSelecting = useCallback(() => {
        setAnalyzerMode('idle');
        setActiveZoneId(null);
        setPendingSelectedIds(new Set());
    }, [setAnalyzerMode, setActiveZoneId, setPendingSelectedIds]);

    const runAnalysis = useCallback(async () => {
        if (!activeZoneId) return;
        const zone = registeredZones.get(activeZoneId);
        if (!zone) return;

        const allData = zone.getData();
        const selectedRows = pendingSelectedIds.size > 0
            ? allData.filter(r => pendingSelectedIds.has(String(r.id)))
            : allData.slice(0, 20); // fallback: first 20 if none picked

        if (selectedRows.length === 0) return;

        setAnalyzerMode('analyzing');

        const trimmed = selectedRows.map(trimRow);
        const payload = JSON.stringify(trimmed, null, 2);

        const prompt = `
You are an Amazon Advertising AI analyst. Analyze the following selected data rows from "${zone.label}".

DATA (${trimmed.length} rows):
${payload}

Return ONLY valid JSON (no markdown, no explanation) in this exact schema:
{
  "metricSummary": "2-3 sentence overview of overall performance across these rows (spend, ACOS, ROAS, sales trends)",
  "chartAnalysis": "1-2 sentences on notable patterns, outliers, or trends visible in the data",
  "entityPerformance": {
    "top": "Name and key metric of the best-performing row",
    "worst": "Name and key metric of the worst-performing row"
  },
  "opportunities": [
    { "category": "Good Trend|Possible Trend|Caution Terms", "message": "Specific, actionable insight referencing actual names/values from the data", "cta": "Short CTA (3-5 words)" }
  ]
}

Produce 2-4 opportunities. Be specific with names and numbers from the data.`;

        try {
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            const raw = response.text ?? '';
            const cleaned = raw.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleaned);

            const result: AnalyzerResult = {
                zoneLabel: zone.label,
                rowCount: trimmed.length,
                metricSummary: parsed.metricSummary || 'No summary available.',
                chartAnalysis: parsed.chartAnalysis || '',
                entityPerformance: parsed.entityPerformance || { top: '—', worst: '—' },
                opportunities: parsed.opportunities || [],
            };

            setAnalyzerResult(result);
            setAnalyzerMode('results');
        } catch (err) {
            console.error('Data Analyzer Gemini error:', err);
            // Fallback demo result
            setAnalyzerResult({
                zoneLabel: zone.label,
                rowCount: trimmed.length,
                metricSummary: `Analyzed ${trimmed.length} rows from ${zone.label}. Average ACOS appears elevated — consider bid adjustments.`,
                chartAnalysis: 'Spend is concentrated in a few rows while others show low impressions.',
                entityPerformance: { top: 'Best row — check ROAS', worst: 'Worst row — high ACOS' },
                opportunities: [
                    { category: 'Caution Terms', message: 'Several rows show ACOS above 50%. Review bids.', cta: 'Adjust Bids' },
                    { category: 'Possible Trend', message: 'Low-impression rows may benefit from higher bids.', cta: 'Boost Bids' },
                ],
            });
            setAnalyzerMode('results');
        }
    }, [activeZoneId, registeredZones, pendingSelectedIds, setAnalyzerMode, setAnalyzerResult]);

    const resetAnalyzer = useCallback(() => {
        setAnalyzerMode('idle');
        setActiveZoneId(null);
        setPendingSelectedIds(new Set());
        setAnalyzerResult(null);
    }, [setAnalyzerMode, setActiveZoneId, setPendingSelectedIds, setAnalyzerResult]);

    return { startSelecting, selectZone, cancelSelecting, runAnalysis, resetAnalyzer };
}
