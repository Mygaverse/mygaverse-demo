'use client';
import React from 'react';
import { Bullseye, Trophy, Cpu } from "react-bootstrap-icons";
import { PhraseInputManager } from "../PhraseInputManager";
import { CustomStrategySection } from "./CustomStrategySection";
import { useCampaignBuilder } from '../data/CampaignBuilderContext';
import {
    StrategyCard,
    FlowItem,
    SimpleTag,
    PlusDivider,
    CampaignFlowRow
} from './StrategyComponents';

export const SBStrategySection = () => {
    const {
        strategy, setStrategy,
        brandName, setBrandName,
        competitorPhrases, setCompetitorPhrases,
        competitorAsins, setCompetitorAsins
    } = useCampaignBuilder();

    const renderBrandAwarenessContent = () => (
        <>
            <div className="flex items-start py-3 px-6 border border-[#e2e2e2] bg-[#eff1f5] mb-5 rounded-md text-sm text-gray-700">
                <span className="font-bold mr-1">Goal Details:</span> Four campaigns with different targeting setups (Keyword, Product, Brand, and Competitor).
            </div>

            <div className="flex flex-col items-start py-6 px-6 border border-[#e2e2e2] gap-6 rounded-md mb-6 w-full">
                <CampaignFlowRow label="Campaign 1">
                    <div className="flex items-center gap-2 p-4">
                        <FlowItem title="Ad group 1" type="keyword" badge="Broad" />
                    </div>
                </CampaignFlowRow>

                <CampaignFlowRow label="Campaign 2">
                    <div className="flex flex-wrap items-center gap-3 p-4">
                        <FlowItem title="Ad group 1" type="keyword" badge="Broad" /> <PlusDivider />
                        <FlowItem title="Ad group 2" type="keyword" badge="Phrase" /> <PlusDivider />
                        <FlowItem title="Ad group 3" type="keyword" badge="Exact" /> <PlusDivider />
                        <FlowItem title="Ad group 4" type="product" badge="Exact" />
                    </div>
                </CampaignFlowRow>

                <CampaignFlowRow label="Campaign 3" labelBadge="Brand">
                    <div className="flex flex-wrap items-center gap-3 p-4">
                        <FlowItem title="Ad group 1" type="keyword" badge="Phrase" /> <PlusDivider />
                        <FlowItem title="Ad group 2" type="keyword" badge="Exact" /> <PlusDivider />
                        <FlowItem title="Ad group 3" type="product" badge="Targeting" />
                    </div>
                </CampaignFlowRow>

                <CampaignFlowRow label="Campaign 4" labelBadge="Competitor">
                    <div className="flex flex-wrap items-center gap-3 p-4">
                        <FlowItem title="Ad group 1" type="keyword" badge="Phrase" /> <PlusDivider />
                        <FlowItem title="Ad group 2" type="keyword" badge="Exact" /> <PlusDivider />
                        <FlowItem title="Ad group 3" type="product" badge="Targeting" />
                    </div>
                </CampaignFlowRow>
            </div>

            <div className="flex flex-col gap-4">
                <PhraseInputManager
                    title="Your Brand Name"
                    placeholder="Press Enter to separate each target."
                    value={brandName}
                    onChange={setBrandName}
                />
                <PhraseInputManager
                    title="Competitor Brand Name"
                    placeholder="Press Enter to separate each target."
                    value={competitorPhrases}
                    onChange={setCompetitorPhrases}
                />
                <PhraseInputManager
                    title="Competitor Product"
                    placeholder="Press Enter to separate each ASIN"
                    value={competitorAsins}
                    onChange={setCompetitorAsins}
                />
            </div>
        </>
    );

    const renderFlagshipCollectionContent = () => (
        <>
            <div className="flex items-start py-3 px-6 border border-[#e2e2e2] bg-[#eff1f5] mb-5 rounded-md text-sm text-gray-700">
                <span className="font-bold mr-1">Goal Details:</span> Two campaigns—one keyword theme campaign, and one campaign with four ad groups.
            </div>

            <div className="flex flex-col items-start py-6 px-6 border border-[#e2e2e2] gap-6 rounded-md mb-6 w-full">
                <CampaignFlowRow label="Campaign 1">
                    <div className="flex items-center gap-2 p-4">
                        <FlowItem title="Ad group 1" type="keyword" badge="Theme" />
                    </div>
                </CampaignFlowRow>

                <CampaignFlowRow label="Campaign 2">
                    <div className="flex flex-wrap items-center gap-3 p-4">
                        <FlowItem title="Ad group 1" type="keyword" badge="Broad" /> <PlusDivider />
                        <FlowItem title="Ad group 2" type="keyword" badge="Phrase" /> <PlusDivider />
                        <FlowItem title="Ad group 3" type="keyword" badge="Exact" /> <PlusDivider />
                        <FlowItem title="Ad group 4" type="product" badge="Exact" />
                    </div>
                </CampaignFlowRow>
            </div>
        </>
    );

    const renderCustomContent = () => (
        <div className="flex items-start py-3 px-6 border border-[#e2e2e2] bg-[#eff1f5] rounded-md text-sm text-gray-700">
            <span className="font-bold mr-1">Goal Details:</span> One campaign and one ad group—choose your Ad Format and Landing Page.
        </div>
    );

    return (
        <div id="strategy" className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm overflow-visible mb-6 z-0 relative">
            <div className="px-6 py-4 border-b border-[#e2e2e2] font-bold text-gray-900 text-lg">
                Goal Strategy
            </div>
            <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <StrategyCard
                        title="Brand Awareness"
                        icon={<Bullseye size={128} />}
                        desc="Increase brand visibility by showcasing your brand logo and multiple products to reach new shoppers across the category."
                        bestFor={[
                            'Emerging brands needing more visibility.',
                            'Brands aiming to grow upper-funnel reach and acquire new shoppers.',
                            'Sellers with many products who want to increase cross-selling.'
                        ]}
                        selected={strategy === 'Brand Awareness'}
                        onSelect={() => setStrategy('Brand Awareness')}
                    />
                    <StrategyCard
                        title="Flagship Collection"
                        icon={<Trophy size={128} />}
                        desc="Showcase a cohesive product line to strengthen overall brand presence."
                        bestFor={[
                            'Sellers who want to showcase a cohesive set of products under one brand story.',
                            'Brands aiming to reinforce brand identity through consistent visual and product messaging.'
                        ]}
                        selected={strategy === 'Flagship Collection'}
                        onSelect={() => setStrategy('Flagship Collection')}
                    />
                    <StrategyCard
                        title="Custom"
                        icon={<Cpu size={128} />}
                        desc="Sellers has own strategy and wants to build one campaign and not follow Bqool campaign structure."
                        bestFor={[
                            'Experienced advertisers that have very specific, sophisticated strategies but can also be complementary to any existing multi-campaign goals you\'re running.'
                        ]}
                        selected={strategy === 'Custom'}
                        onSelect={() => setStrategy('Custom')}
                    />
                </div>

                <div>
                    {strategy === 'Brand Awareness' && renderBrandAwarenessContent()}
                    {strategy === 'Flagship Collection' && renderFlagshipCollectionContent()}
                    {strategy === 'Custom' && renderCustomContent()}
                </div>
            </div>
        </div>
    );
};
