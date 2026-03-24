'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface PageData {
    campaigns?: any[];
    stats?: any[];
    metrics?: any;
    pageContext?: string;
}

export type AnalyzerMode = 'idle' | 'selecting' | 'analyzing' | 'results';

export interface DataZone {
    id: string;
    label: string;        // e.g. "Campaigns Table"
    type: 'table' | 'metric-card' | 'chart';
    getData: () => any[]; // callback to get currently active/filtered data
}

export interface AnalyzerResult {
    zoneLabel: string;
    rowCount: number;
    metricSummary: string;
    chartAnalysis: string;
    entityPerformance: { top: string; worst: string };
    opportunities: { category: string; message: string; cta: string }[];
}

interface PilotContextType {
    isOpen: boolean;
    pageData: PageData | null;
    openPilot: () => void;
    closePilot: () => void;
    togglePilot: () => void;
    setPageData: (data: PageData) => void;
    // Data Analyzer
    analyzerMode: AnalyzerMode;
    setAnalyzerMode: (mode: AnalyzerMode) => void;
    registeredZones: Map<string, DataZone>;
    registerZone: (zone: DataZone) => void;
    unregisterZone: (id: string) => void;
    activeZoneId: string | null;
    setActiveZoneId: (id: string | null) => void;
    analyzerResult: AnalyzerResult | null;
    setAnalyzerResult: (result: AnalyzerResult | null) => void;
    // Selected rows (set by the active table)
    pendingSelectedIds: Set<string>;
    setPendingSelectedIds: (ids: Set<string>) => void;
}

const PilotContext = createContext<PilotContextType | undefined>(undefined);

export function PilotProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [pageData, setPageData] = useState<PageData | null>(null);
    // Analyzer state
    const [analyzerMode, setAnalyzerMode] = useState<AnalyzerMode>('idle');
    const [registeredZones, setRegisteredZones] = useState<Map<string, DataZone>>(new Map());
    const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
    const [analyzerResult, setAnalyzerResult] = useState<AnalyzerResult | null>(null);
    const [pendingSelectedIds, setPendingSelectedIds] = useState<Set<string>>(new Set());

    const openPilot = () => setIsOpen(true);
    const closePilot = () => setIsOpen(false);
    const togglePilot = () => setIsOpen(prev => !prev);

    const registerZone = useCallback((zone: DataZone) => {
        setRegisteredZones(prev => new Map(prev).set(zone.id, zone));
    }, []);

    const unregisterZone = useCallback((id: string) => {
        setRegisteredZones(prev => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    }, []);

    return (
        <PilotContext.Provider value={{
            isOpen, pageData, openPilot, closePilot, togglePilot, setPageData,
            analyzerMode, setAnalyzerMode,
            registeredZones, registerZone, unregisterZone,
            activeZoneId, setActiveZoneId,
            analyzerResult, setAnalyzerResult,
            pendingSelectedIds, setPendingSelectedIds,
        }}>
            {children}
        </PilotContext.Provider>
    );
}

export function usePilot() {
    const context = useContext(PilotContext);
    if (context === undefined) {
        throw new Error('usePilot must be used within a PilotProvider');
    }
    return context;
}
