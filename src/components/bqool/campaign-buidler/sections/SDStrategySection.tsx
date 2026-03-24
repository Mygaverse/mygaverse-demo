'use client';
import React from 'react';
import { Bullseye, Trophy, Search, Display, Plus } from "react-bootstrap-icons";
import { useCampaignBuilder } from '../data/CampaignBuilderContext';
import {
    StrategyCard,
    FlowItem,
    SimpleTag,
    PlusDivider,
    CampaignFlowRow
} from './StrategyComponents';

export const SDStrategySection = () => {
    const {
        strategy, setStrategy
    } = useCampaignBuilder();

    const renderRemarketingContent = () => (
        <>
            <div className="flex items-start py-3 px-6 border border-[#e2e2e2] bg-[#eff1f5] mb-5 rounded-md text-sm text-gray-700">
                <span className="font-bold mr-1">Goal Details:</span> Two campaigns including four ad groups with different views remarketing targets (30-day lookback).
            </div>

            <div className="flex flex-col items-start py-6 px-6 border border-[#e2e2e2] gap-6 rounded-md mb-6 w-full">
                <CampaignFlowRow label="Campaign 1">
                    <div className="flex items-center gap-2 p-4">
                        <FlowItem title="Ad group 1" type="remarketing" badge="Views remarketing" details="Advertised products Lookback: 30 days" />
                    </div>
                </CampaignFlowRow>

                <CampaignFlowRow label="Campaign 2">
                    <div className="flex flex-col gap-4 p-4 w-full">
                        <div className="flex items-center gap-3">
                            <FlowItem title="Ad group 1" type="remarketing" badge="Views remarketing" details="Similar to advertised products Lookback: 30 days" />
                            <Plus size={20} className="text-gray-400" />
                        </div>
                        <div className="flex items-center gap-3">
                            <FlowItem title="Ad group 2" type="remarketing" badge="Views remarketing" details="Category 1 Lookback: 30 days" />
                            <Plus size={20} className="text-gray-400" />
                            <FlowItem title="Ad group 3" type="remarketing" badge="Views remarketing" details="Category ...N Lookback: 30 days" />
                        </div>
                    </div>
                </CampaignFlowRow>
            </div>
        </>
    );

    const renderConquerDefendContent = () => (
        <>
            <div className="flex items-start py-3 px-6 border border-[#e2e2e2] bg-[#eff1f5] mb-5 rounded-md text-sm text-gray-700">
                <span className="font-bold mr-1">Goal Details:</span> Two campaigns with three ad groups using contextual targeting, including ASINs and categories.
            </div>

            <div className="flex flex-col items-start py-6 px-6 border border-[#e2e2e2] gap-6 rounded-md mb-6 w-full">
                <CampaignFlowRow label="Campaign 1">
                    <div className="flex items-center gap-2 p-4">
                        <FlowItem title="Ad group 1" type="product" badge="Contextual" details="Products (Your ASIN)" />
                    </div>
                </CampaignFlowRow>

                <CampaignFlowRow label="Campaign 2">
                    <div className="flex flex-col gap-4 p-4 w-full">
                        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded">
                            <div className="text-xs font-bold text-[#4aaada] mr-2">Ad group 1</div>
                            <SimpleTag label="Contextual Similar to advertised products" /> <Plus size={14} />
                            <SimpleTag label="Contextual Category 1" /> <Plus size={14} />
                            <SimpleTag label="Contextual Category 2" /> <Plus size={14} />
                            <SimpleTag label="Contextual Category ...N" />
                        </div>
                        <div className="flex items-center gap-2">
                             <FlowItem title="Ad group 2" type="product" badge="Contextual" details="Products (Competitor ASIN)" />
                        </div>
                    </div>
                </CampaignFlowRow>
            </div>
        </>
    );

    const renderDiscoverAudiencesContent = () => (
        <>
            <div className="flex items-start py-3 px-6 border border-[#e2e2e2] bg-[#eff1f5] mb-5 rounded-md text-sm text-gray-700">
                <span className="font-bold mr-1">Goal Details:</span> One campaign with broad audience targeting to reach new potential customers.
            </div>

            <div className="flex flex-col items-start py-6 px-6 border border-[#e2e2e2] gap-6 rounded-md mb-6 w-full">
                <CampaignFlowRow label="Campaign 1">
                    <div className="flex flex-col gap-3 p-4 w-full bg-gray-50 border border-gray-100 rounded">
                        <div className="text-xs font-bold text-[#4aaada]">Ad group 1</div>
                        <div className="flex flex-wrap items-center gap-2">
                            <SimpleTag label="In-market audiences Audiences 1" /> <Plus size={14} />
                            <SimpleTag label="In-market audiences Audiences 2" /> <Plus size={14} />
                            <SimpleTag label="In-market audiences Audiences ...N" />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <SimpleTag label="Interest and lifestyle audiences Audiences 1" /> <Plus size={14} />
                            <SimpleTag label="Interest and lifestyle audiences Audiences 2" /> <Plus size={14} />
                            <SimpleTag label="Interest and lifestyle audiences Audiences ...N" />
                        </div>
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
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <StrategyCard
                        title="Remarketing"
                        icon={<Bullseye size={128} />}
                        desc="Reach shoppers who interacted with your products and those familiar with the category to encourage them to complete their purchase."
                        bestFor={[
                            'Sellers wanting to recover high-intent shoppers.',
                            'Products with good traffic but low conversion.',
                            'Promotions or product launches needing retargeting.'
                        ]}
                        selected={strategy === 'Remarketing'}
                        onSelect={() => setStrategy('Remarketing')}
                    />
                    <StrategyCard
                        title="Conquer & Defend"
                        icon={<Trophy size={128} />}
                        desc="Reach shoppers browsing competitors or related categories, protect your brand visibility from rival ads, and expand into competitor audiences to capture more demand."
                        bestFor={[
                            'Sellers entering competitive categories.',
                            'Brands wanting to capture competitor traffic.',
                            'Products needing higher visibility beside top competitors.'
                        ]}
                        selected={strategy === 'Conquer & Defend'}
                        onSelect={() => setStrategy('Conquer & Defend')}
                    />
                    <StrategyCard
                        title="Discover New Audiences"
                        icon={<Search size={128} />}
                        desc="Reach new people using In-Market, Lifestyle, and Interest targeting, showcase your products beyond your main category, and uncover new growth opportunities."
                        bestFor={[
                            'Sellers wanting to discover new customer groups.',
                            'Products suitable for broader audiences (interest/lifestyle).',
                            'Brands looking to scale beyond current category traffic.'
                        ]}
                        selected={strategy === 'Discover New Audiences'}
                        onSelect={() => setStrategy('Discover New Audiences')}
                    />
                    <StrategyCard
                        title="Custom"
                        icon={<Display size={128} />}
                        desc="Sellers has own strategy and wants to build one campaign and not follow Bqool campaign structure."
                        bestFor={[
                            'Experienced advertisers that have very specific, sophisticated strategies but can also be complementary to any existing multi-campaign goals you\'re running.'
                        ]}
                        selected={strategy === 'Custom'}
                        onSelect={() => setStrategy('Custom')}
                    />
                </div>

                <div>
                    {strategy === 'Remarketing' && renderRemarketingContent()}
                    {strategy === 'Conquer & Defend' && renderConquerDefendContent()}
                    {strategy === 'Discover New Audiences' && renderDiscoverAudiencesContent()}
                    {strategy === 'Custom' && renderCustomContent()}
                </div>
            </div>
        </div>
    );
};
