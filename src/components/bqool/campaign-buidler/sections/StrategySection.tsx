'use client';
import React, { useState } from 'react';
import { Bullseye, Trophy, Megaphone, Cpu, CheckCircleFill, Plus } from "react-bootstrap-icons";
import { Badge } from "../../ui/Badge";
import { PhraseInputManager } from "../PhraseInputManager"; //Brand-based and Competitor-based phrase inputs
import { CustomStrategySection } from "./CustomStrategySection";// component for Custom Strategy
import { useCampaignBuilder } from '../data/CampaignBuilderContext';

// --- SUB-COMPONENT: STRATEGY CARD ---
interface StrategyCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
    bestFor: string[];
    selected: boolean;
    onSelect: () => void;
}

const StrategyCard = ({ icon, title, desc, bestFor, selected, onSelect }: StrategyCardProps) => (
    <div 
        onClick={onSelect}
        className={`
            flex flex-col h-full rounded-xl border transition-all cursor-pointer relative group overflow-visible
            ${selected 
                ? 'border-[#4aaada] ring-1 ring-[#4aaada] bg-[#f1f7ff]' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'}
        `}
    >
        {/* Offset Checkmark Badge */}
        {selected && (
            <div className="absolute -top-4 -right-4 bg-white rounded-full p-0.5 z-20 shadow-sm">
                <CheckCircleFill className="text-[#4aaada]" size={36} />
            </div>
        )}

        {/* Top Compartment (Info) */}
        <div className="p-5 flex flex-col items-center flex-1">
            <div className={`mb-3 ${selected ? 'text-[#4aaada]' : 'text-gray-400 group-hover:text-[#4aaada]'}`}>
                {icon}
            </div>
            <div className="text-center font-bold text-gray-900 mb-2 text-xl">{title}</div>
            <div className="text-base text-gray-900 text-left mt-1 mb-4 leading-relaxed">
                {desc}
            </div>
        </div>

        {/* Bottom Compartment (Best For) */}
        <div className={`
            p-4 border-t text-xs rounded-b-xl flex-1
            ${selected ? 'bg-[#f0f7ff] border-[#d0e3f5]' : 'bg-[#f0f7ff] border-gray-100'}
        `}>
            <div className="text-base text-gray-900 font-bold mb-2">Best for</div>
            <ul className="text-gray-600 space-y-1.5">
                {bestFor.map((bf, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-base">
                        <span className="text-base text-gray-600 mt-0.5">•</span> {bf}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

// --- SUB-COMPONENT: FLOW ITEM ---
// Renders the pill like [Ad Group 1 | Keyword Broad]
const FlowItem = ({ title, type, badge }: { title: string, type: 'keyword' | 'product', badge: string }) => (
    <div className="flex items-center gap-2 pr-3 py-0 border border-[#4aaada] rounded-lg bg-white shrink-0 shadow-sm">
        <div className="px-3 py-2 text-[12px] rounded transition-colors bg-[#f1f7ff] text-[#0066b7] rounded-l-lg font-bold whitespace-nowrap">
            {title}
        </div>
        <div className="px-2 py-1 text-[12px] bg-white border border-[#e2e2e2] rounded-full text-black whitespace-nowrap">
            {type === 'keyword' ? <span className="font-bold">Keyword</span> : <span className="font-bold">Product</span>} {badge}
        </div>
    </div>
);

// Simple Tag like [Close Match]
const SimpleTag = ({ label }: { label: string }) => (
    <div className="px-2 py-1 text-[12px] bg-white border border-[#e2e2e2] rounded-full text-black whitespace-nowrap">
        {label}
    </div>
);

// Plus Icon Divider
const PlusDivider = () => (
    <div className="bg-[#8597a9] w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10">
        <Plus className="w-4 h-4 text-white font-bold" />
    </div>
);

// --- CAMPAIGN FLOW ROW ---
interface CampaignFlowRowProps {
    label: string;
    labelBadge?: string; // Optional Badge (e.g. "Brand", "Top Conversion")
    variant?: 'auto' | 'manual'; // Controls the container style
    children: React.ReactNode;
}

// Reusable Row Component for the Diagram
const CampaignFlowRow = ({ label, labelBadge, variant = 'manual', children }: CampaignFlowRowProps) => {
    // Type 1 (Auto): Solid border, White BG, Rounded
    const autoStyles = "border border-[#4aaada] bg-white rounded-lg w-fit";
    // Type 2 & 3 (Manual): Dotted border, Gray BG, Rounded
    const manualStyles = "border-2 border-dotted border-[#4aaada] bg-[#eff1f5] rounded-lg";

    const containerStyles = variant === 'auto' ? autoStyles : manualStyles;

    return (
        <div className="flex items-center gap-0 w-full">
            {/* Label Box */}
            <div className="bg-[#4aaada] w-fit text-white px-4 py-3.5 rounded-md text-[13px] font-medium whitespace-nowrap text-center shrink-0">
                {label}
                {/* Optional Badge inside Label */}
                {labelBadge && (
                    <span className="px-2 py-1 ml-2 text-[12px] rounded-lg transition-colors bg-[#f1f7ff]/60 text-gray-900 font-medium whitespace-nowrap">
                        {labelBadge}
                    </span>
                )}
            </div>
            {/* Connector */}
            <div className="bg-[#4aaada] h-[2px] w-[40px] shrink-0" />
            
            {/* Content Container */}
            <div className="flex-1 overflow-x-auto">
                <div className={`flex items-center w-fit ${containerStyles}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const StrategySection = () => {
    // Use Context
    const { 
        strategy, setStrategy, 
        brandedPhrases, setBrandedPhrases,
        competitorPhrases, setCompetitorPhrases
    } = useCampaignBuilder();

    // --- RENDERER: BASIC STRATEGY CONTENT ---
    const renderBasicContent = () => (
        <>
        {/* 2. DESCRIPTION BOX */}
            <div className="flex items-start py-3 px-6 border border-[#e2e2e2] bg-[#eff1f5] mb-5 rounded-md">
                <p className="text-sm text-gray-700">
                    <span className="font-bold">Goal Details:</span> Two campaigns including one auto campaign and one manual campaign.
                </p>
            </div>

            {/* 3. FLOW DIAGRAM (Using Flexbox Layout from your React example) */}
            <div className="flex flex-col items-start py-6 px-6 border border-[#e2e2e2] gap-6 rounded-md">
                {/* ROW A: Auto Campaign */}
                <CampaignFlowRow label="Auto Campaign" variant="auto">
                    <div className="flex items-center gap-2 pr-2">
                        <span className="flex items-center rounded-l-lg bg-[#f1f7ff] px-3 py-2 text-sm font-bold text-[#0066b7] mr-2">Ad group 1</span>
                        <SimpleTag label="Close Match" />
                        <SimpleTag label="Loose Match" />
                        <SimpleTag label="Complements" />
                        <SimpleTag label="Substitutes" />
                    </div>
                </CampaignFlowRow>

                {/* ROW B: Manual Campaign */}
                <CampaignFlowRow label="Manual Campaign" variant="manual">
                    <div className="flex flex-wrap items-center gap-3 p-4">
                        <FlowItem title="Ad group 1" type="keyword" badge="Broad" /> <PlusDivider />
                        <FlowItem title="Ad group 2" type="keyword" badge="Phrase" /> <PlusDivider />
                        <FlowItem title="Ad group 3" type="keyword" badge="Exact" /> <PlusDivider />
                        <FlowItem title="Ad group 4" type="product" badge="Exact" /> <PlusDivider />
                        <FlowItem title="Ad group 5" type="product" badge="Expanded" />
                    </div>
                </CampaignFlowRow>

            </div>
        </>
    );

    // --- RENDERER: ADVANCED STRATEGY CONTENT ---
    const renderAdvancedContent = () => (
        <>
            {/* Description Box (Updated Text) */}
            <div className="flex items-start py-3 px-6 border border-[#e2e2e2] bg-[#eff1f5] mb-5 rounded-md">
                <p className="text-sm text-gray-700">
                    <span className="font-bold">Goal Details:</span> Three campaigns including one auto campaign and two manual campaigns.
                </p>
            </div>

            {/* Flow Diagram */}
            <div className="flex flex-col items-start py-6 px-6 border border-[#e2e2e2] gap-6 rounded-md">
                {/* ROW A: Auto Campaign */}
                <CampaignFlowRow label="Auto Campaign" variant="auto">
                    <div className="flex items-center gap-2 pr-2">
                        <span className="flex items-center rounded-l-lg bg-[#f1f7ff] px-3 py-2 text-sm font-bold text-[#0066b7] mr-2">Ad group 1</span>
                        <SimpleTag label="Close Match" />
                        <SimpleTag label="Loose Match" />
                        <SimpleTag label="Complements" />
                        <SimpleTag label="Substitutes" />
                    </div>
                </CampaignFlowRow>

                {/* ROW B: Manual Campaign */}
                <CampaignFlowRow label="Manual Campaign" variant="manual">
                    <div className="flex flex-wrap items-center gap-3 p-4">
                        <FlowItem title="Ad group 1" type="keyword" badge="Broad" /> <PlusDivider />
                        <FlowItem title="Ad group 2" type="keyword" badge="Phrase" /> <PlusDivider />
                        <FlowItem title="Ad group 3" type="keyword" badge="Exact" /> <PlusDivider />
                        <FlowItem title="Ad group 4" type="product" badge="Exact" /> <PlusDivider />
                        <FlowItem title="Ad group 5" type="product" badge="Expanded" />
                    </div>
                </CampaignFlowRow>

                {/* ROW C: Manual Campaign - Top Conversion */}
                <CampaignFlowRow label="Manual Campaign" labelBadge="Top Conversion" variant="manual">
                    <div className="flex flex-wrap items-center gap-3 p-4">
                        <FlowItem title="Ad group 1" type="keyword" badge="Exact" /> <PlusDivider />
                        <FlowItem title="Ad group 2" type="product" badge="Targeting" />
                    </div>
                </CampaignFlowRow>

            </div>
        </>
    );

    // 3. BRAND-BASED CONTENT
    const renderBrandBasedContent = () => (
        <>
            <div className="flex items-start py-3 px-6 border border-[#e2e2e2] bg-[#eff1f5] mb-5 rounded-md text-sm text-gray-700">
                <span className="font-bold mr-1">Goal Details:</span> Four campaigns including one auto campaign and three manual campaigns.
            </div>
            
            {/* Flow Diagram (4 Rows) */}
            <div className="flex flex-col items-start py-6 px-6 border border-[#e2e2e2] gap-6 rounded-md mb-6">
                
                {/* ROW A: Auto Campaign */}
                <CampaignFlowRow label="Auto Campaign" variant="auto">
                    <div className="flex items-center gap-2 pr-2">
                        <span className="flex items-center rounded-l-lg bg-[#f1f7ff] px-3 py-2 text-sm font-bold text-[#0066b7] mr-2">Ad group 1</span>
                        <SimpleTag label="Close Match" />
                        <SimpleTag label="Loose Match" />
                        <SimpleTag label="Complements" />
                        <SimpleTag label="Substitutes" />
                    </div>
                </CampaignFlowRow>

                {/* ROW B: Manual Campaign */}
                <CampaignFlowRow label="Manual Campaign" variant="manual">
                    <div className="flex flex-wrap items-center gap-3 p-4">
                        <FlowItem title="Ad group 1" type="keyword" badge="Broad" /> <PlusDivider />
                        <FlowItem title="Ad group 2" type="keyword" badge="Phrase" /> <PlusDivider />
                        <FlowItem title="Ad group 3" type="keyword" badge="Exact" /> <PlusDivider />
                        <FlowItem title="Ad group 4" type="product" badge="Exact" /> <PlusDivider />
                        <FlowItem title="Ad group 5" type="product" badge="Expanded" />
                    </div>
                </CampaignFlowRow>

                {/* ROW C: Manual Campaign - Brand */}
                <CampaignFlowRow label="Manual Campaign" labelBadge="Brand" variant="manual">
                    <div className="flex flex-wrap items-center gap-3 p-4">
                        <FlowItem title="Ad group 1" type="keyword" badge="Phrase" /> <PlusDivider />
                        <FlowItem title="Ad group 2" type="keyword" badge="Exact" /> <PlusDivider />
                        <FlowItem title="Ad group 3" type="product" badge="Targeting" />
                    </div>
                </CampaignFlowRow>

                {/* ROW D: Manual Campaign - Competitor */}
                <CampaignFlowRow label="Manual Campaign" labelBadge="Competitor" variant="manual">
                    <div className="flex flex-wrap items-center gap-3 p-4">
                        <FlowItem title="Ad group 1" type="keyword" badge="Phrase" /> <PlusDivider />
                        <FlowItem title="Ad group 2" type="keyword" badge="Exact" /> <PlusDivider />
                        <FlowItem title="Ad group 3" type="product" badge="Targeting" />
                    </div>
                </CampaignFlowRow>
            </div>

            {/* Inputs Section (2 Forms as per image) */}
            <div className="flex flex-col gap-4">
                <PhraseInputManager 
                    title="Branded Phrases" 
                    placeholder="Please separate each brand by pressing Enter" 
                    value={brandedPhrases} // Pass current state
                    onChange={setBrandedPhrases} // Update context on change
                />
                <PhraseInputManager 
                    title="Competitor Phrases" 
                    placeholder="Please separate each competitor brand by pressing Enter"
                    value={competitorPhrases} // Pass current state
                    onChange={setCompetitorPhrases} // Update context on change
                />
            </div>
        </>
    );

    // 4. CUSTOM CONTENT
    const renderCustomContent = () => (
        <CustomStrategySection />
    );

    return (
        <div id="strategy" className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm overflow-visible mb-6 z-0 relative">
            <div className="px-6 py-4 border-b border-[#e2e2e2] font-bold text-gray-900 text-lg">
                Goal Strategy
            </div>
            
            <div className="p-6">
                
                {/* 1. CARDS ROW */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <StrategyCard
                        title="Basic"
                        icon={<Bullseye size={128}/>}
                        desc="This is the broadest campaign structure, launching both an Auto and a Manual campaign. It helps collect initial data like competitor keywords and ASINs for products without brand recognition."
                        bestFor={['New products with no brand recognition.', 'Products that need broad data collection and performance insights.']}
                        selected={strategy === 'Basic'}
                        onSelect={() => setStrategy('Basic')}
                    />
                    <StrategyCard
                        title="Advanced"
                        icon={<Trophy size={128}/>}
                        desc="This goal expands upon the Basic structure by investing more in high-performing targets. It allocates additional budget to Manual campaigns based on targets with 3+ orders and a top 90% conversion rate."
                        bestFor={['Products with sufficient campaign data.', 'Products with high-performing targets ready for optimization.']}
                        selected={strategy === 'Advanced'}
                        onSelect={() => setStrategy('Advanced')}
                    />
                    <StrategyCard
                        title="Brand-Based"
                        icon={<Megaphone size={128}/>}
                        desc="This structure is designed for products with strong brand demand. It separates budgets for branded search terms and competitor targeting to maximize brand visibility and performance."
                        bestFor={['Established brands with strong search demand.', 'Products targeting specific competitors.']}
                        selected={strategy === 'Brand-Based'}
                        onSelect={() => setStrategy('Brand-Based')}
                    />
                    <StrategyCard
                        title="Custom"
                        icon={<Cpu size={128}/>}
                        desc="This structure is for sellers who prefer to create a single campaign, either Auto or Manual, without the need for multiple campaigns, offering a simpler setup for focused advertising."
                        bestFor={['Sellers who prefer a simple setup with one campaign.']}
                        selected={strategy === 'Custom'}
                        onSelect={() => setStrategy('Custom')}
                    />
                </div>

                {/* 2. CONTENT TOGGLE LOGIC */}
                <div>
                    {strategy === 'Basic' && renderBasicContent()}
                    {strategy === 'Advanced' && renderAdvancedContent()}
                    {strategy === 'Brand-Based' && renderBrandBasedContent()}
                    {strategy === 'Custom' && renderCustomContent()}
                </div>
            </div> 
        </div>
    );
};