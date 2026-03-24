'use client';
import React from 'react';
import { CheckCircleFill, Plus } from "react-bootstrap-icons";

// --- SUB-COMPONENT: STRATEGY CARD ---
export interface StrategyCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
    bestFor: string[];
    selected: boolean;
    onSelect: () => void;
}

export const StrategyCard = ({ icon, title, desc, bestFor, selected, onSelect }: StrategyCardProps) => (
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
export const FlowItem = ({
    title,
    type,
    badge,
    details
}: {
    title: string,
    type: 'keyword' | 'product' | 'remarketing' | 'audience',
    badge: string,
    details?: string
}) => (
    <div className="flex items-center gap-2 pr-3 py-0 border border-[#4aaada] rounded-lg bg-white shrink-0 shadow-sm">
        <div className="px-3 py-2 text-[12px] rounded transition-colors bg-[#f1f7ff] text-[#0066b7] rounded-l-lg font-bold whitespace-nowrap">
            {title}
        </div>
        <div className="flex flex-col py-1">
            <div className="px-2 py-1 text-[12px] bg-white border border-[#e2e2e2] rounded-full text-black whitespace-nowrap w-fit">
                <span className="font-bold">
                    {type === 'keyword' && 'Keyword'}
                    {type === 'product' && 'Product'}
                    {type === 'remarketing' && 'Remarketing'}
                    {type === 'audience' && 'Audience'}
                </span> {badge}
            </div>
            {details && (
                <div className="text-[10px] text-gray-500 px-2 mt-0.5 leading-tight">
                    {details}
                </div>
            )}
        </div>
    </div>
);

// Simple Tag like [Close Match]
export const SimpleTag = ({ label }: { label: string }) => (
    <div className="px-2 py-1 text-[12px] bg-white border border-[#e2e2e2] rounded-full text-black whitespace-nowrap">
        {label}
    </div>
);

// Plus Icon Divider
export const PlusDivider = () => (
    <div className="bg-[#8597a9] w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10">
        <Plus className="w-4 h-4 text-white font-bold" />
    </div>
);

// --- CAMPAIGN FLOW ROW ---
export interface CampaignFlowRowProps {
    label: string;
    labelBadge?: string;
    variant?: 'auto' | 'manual';
    children: React.ReactNode;
}

export const CampaignFlowRow = ({ label, labelBadge, variant = 'manual', children }: CampaignFlowRowProps) => {
    const autoStyles = "border border-[#4aaada] bg-white rounded-lg w-fit";
    const manualStyles = "border-2 border-dotted border-[#4aaada] bg-[#eff1f5] rounded-lg";
    const containerStyles = variant === 'auto' ? autoStyles : manualStyles;

    return (
        <div className="flex items-center gap-0 w-full">
            <div className="bg-[#4aaada] w-fit text-white px-4 py-3.5 rounded-md text-[13px] font-medium whitespace-nowrap text-center shrink-0">
                {label}
                {labelBadge && (
                    <span className="px-2 py-1 ml-2 text-[12px] rounded-lg transition-colors bg-[#f1f7ff]/60 text-gray-900 font-medium whitespace-nowrap">
                        {labelBadge}
                    </span>
                )}
            </div>
            <div className="bg-[#4aaada] h-[2px] w-[40px] shrink-0" />
            <div className="flex-1 overflow-x-auto">
                <div className={`flex items-center w-fit ${containerStyles}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};
