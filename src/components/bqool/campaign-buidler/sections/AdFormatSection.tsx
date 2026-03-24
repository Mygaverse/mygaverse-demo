'use client';
import React from 'react';
import { RecordCircle, Circle, BoxArrowUpRight, ExclamationTriangle } from "react-bootstrap-icons";
import { useCampaignBuilder } from '../data/CampaignBuilderContext';

const FormatCard = ({ title, desc, icon, selected, onSelect }: { title: string, desc: string, icon: React.ReactNode, selected: boolean, onSelect: () => void }) => (
    <div
        onClick={onSelect}
        className={`
            flex flex-col p-6 rounded-lg border-2 transition-all cursor-pointer w-[320px] h-[220px]
            ${selected ? 'border-[#4aaada] bg-[#f0f7ff]' : 'border-[#e2e2e2] bg-white hover:border-gray-300'}
        `}
    >
        <div className="flex justify-between items-start mb-4">
            <span className="font-bold text-gray-900 text-lg">{title}</span>
        </div>

        <div className="flex-1 flex items-center justify-center mb-4">
            {icon}
        </div>

        <div className="text-sm text-gray-700 leading-tight">
            {desc}
        </div>
    </div>
);

const ProductCollectionIcon = () => (
    <div className="relative w-24 h-16 bg-[#e9ecef] border border-gray-200 rounded p-2">
        <div className="w-4 h-4 bg-gray-300 rounded-sm mb-1" />
        <div className="w-12 h-1 bg-gray-300 rounded-px mb-1" />
        <div className="w-8 h-1 bg-gray-300 rounded-px" />
    </div>
);

const StoreSpotlightIcon = () => (
    <div className="relative w-24 h-16 bg-[#e9ecef] border border-gray-200 rounded p-2 flex gap-1">
        <div className="w-6 h-full bg-gray-300 rounded-sm" />
        <div className="flex-1 flex flex-col gap-1">
            <div className="w-full h-2 bg-gray-300 rounded-px" />
            <div className="flex gap-1 h-full">
                <div className="flex-1 bg-gray-300 rounded-sm" />
                <div className="flex-1 bg-gray-300 rounded-sm" />
                <div className="flex-1 bg-gray-300 rounded-sm" />
            </div>
        </div>
    </div>
);

const VideoIcon = () => (
    <div className="relative w-24 h-16 bg-[#c5d1df] rounded flex flex-col justify-end p-2 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-white opacity-60">
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
        </div>
        <div className="flex gap-1">
            <div className="w-3 h-2 bg-gray-400/50 rounded-sm" />
            <div className="w-6 h-1 bg-[#4aaada] rounded-px self-end" />
            <div className="w-3 h-2 bg-gray-400/50 rounded-sm" />
        </div>
    </div>
);

export const AdFormatSection = () => {
    const { adType, strategy, adFormat, setAdFormat, landingPage, setLandingPage } = useCampaignBuilder();

    const isBrandAwareness = strategy === 'Brand Awareness';
    const isFlagship = strategy === 'Flagship Collection';
    const isCustom = strategy === 'Custom';
    const isSD = adType === 'Sponsored Display';

    // SD strategies that don't show landing page options
    const isSDpreset = isSD && (strategy === 'Remarketing' || strategy === 'Conquer & Defend' || strategy === 'Discover New Audiences');

    const showLandingPage = (isBrandAwareness && adFormat === 'product-collection') ||
                          (isCustom && !isSD) ||
                          (isSD && isCustom && adFormat === 'product-collection');

    const sources = React.useMemo(() => {
        if (isBrandAwareness) return ['Amazon Store'];
        if (isCustom) {
            if (isSD) {
                if (adFormat === 'product-collection') return ['Amazon Store', 'Product detail page'];
                return [];
            }
            if (adFormat === 'product-collection') return ['Amazon Store', 'New Landing Page'];
            if (adFormat === 'video') return ['Amazon Store', 'Product detail page'];
            if (adFormat === 'store-spotlight') return ['Amazon Store'];
        }
        return [];
    }, [isBrandAwareness, isCustom, adFormat, isSD]);

    const handleSourceChange = (src: string) => {
        setLandingPage({ ...landingPage, source: src });
    };

    const isStoreSpotlight = adFormat === 'store-spotlight';

    return (
        <div id="ad-format" className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-[#e2e2e2] font-bold text-gray-900 text-lg">
                Ad Format
            </div>

            <div className="p-6">
                <div className="flex gap-4 mb-8">
                    <FormatCard
                        title={isSD ? "Image" : "Product collection"}
                        desc={isSD ? "Showcase your product with a custom image." : "Promote multiple products from a landing page of your choice."}
                        icon={<ProductCollectionIcon />}
                        selected={adFormat === 'product-collection'}
                        onSelect={() => setAdFormat('product-collection')}
                    />
                    {isCustom && !isSD && (
                        <FormatCard
                            title="Store spotlight"
                            desc="Promote your product categories or pages within your Brand Store on Amazon."
                            icon={<StoreSpotlightIcon />}
                            selected={adFormat === 'store-spotlight'}
                            onSelect={() => setAdFormat('store-spotlight')}
                        />
                    )}
                    <FormatCard
                        title={isSD ? "Videos" : "Video"}
                        desc="Use video to promote your brand and products."
                        icon={<VideoIcon />}
                        selected={adFormat === 'video'}
                        onSelect={() => setAdFormat('video')}
                    />
                </div>

                {showLandingPage && sources.length > 0 && (
                    <div className="space-y-6">
                        <div className="font-bold text-gray-900 mb-0">Landing Page</div>

                        {sources.map(src => (
                            <div key={src} className="flex items-start gap-4">
                                <div
                                    className="cursor-pointer flex items-center mt-1"
                                    onClick={() => handleSourceChange(src)}
                                >
                                    {landingPage.source === src ? <RecordCircle className="text-[#4aaada]" size={16} /> : <Circle className="text-gray-300" size={16} />}
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-6">
                                        <span className={`text-sm font-medium w-36 ${landingPage.source === src ? 'text-gray-900' : 'text-gray-500 cursor-pointer'}`} onClick={() => handleSourceChange(src)}>
                                            {src}
                                        </span>

                                        {src === 'Amazon Store' && landingPage.source === src && (
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-500 w-32">Choose a store</span>
                                                <div className="flex flex-col gap-1">
                                                    <select
                                                        className="border border-[#e2e2e2] rounded px-3 py-1.5 text-sm min-w-[280px] outline-none focus:border-[#4aaada]"
                                                        value={landingPage.name}
                                                        onChange={(e) => setLandingPage({ ...landingPage, name: e.target.value })}
                                                    >
                                                        <option value="TeststoreABC">TeststoreABC</option>
                                                        <option value="MyBrandStore">MyBrandStore</option>
                                                        <option value="OfficialStore">OfficialStore</option>
                                                    </select>
                                                    {isStoreSpotlight && (
                                                        <div className="flex items-center gap-1.5 text-[#d93025] text-[12px] mt-1">
                                                            <ExclamationTriangle size={12} /> Store must have 4 or more pages, each with 1 or more unique products.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {src === 'Amazon Store' && landingPage.source === src && (
                                        <div className="flex items-center gap-6">
                                            <div className="w-36" /> {/* Placeholder to align Choose X subpage */}
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-500 w-32">
                                                    {isStoreSpotlight ? "Choose 3 subpages" : "Choose 1 subpage"}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        className="border border-[#e2e2e2] rounded px-3 py-1.5 text-sm min-w-[280px] outline-none focus:border-[#4aaada]"
                                                        value={isStoreSpotlight ? "Select subpages" : landingPage.subpages[0]}
                                                        onChange={(e) => setLandingPage({ ...landingPage, subpages: [e.target.value] })}
                                                    >
                                                        {isStoreSpotlight && <option value="Select subpages">Select subpages</option>}
                                                        <option value="Home">Home</option>
                                                        <option value="Deals">Deals</option>
                                                        <option value="New Items">New Items</option>
                                                        <option value="Home & Office">Home & Office</option>
                                                    </select>
                                                    <a href="#" className="flex items-center gap-1 text-[#4aaada] text-sm hover:underline">
                                                        See page <BoxArrowUpRight size={12} />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
