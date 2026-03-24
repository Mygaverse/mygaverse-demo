'use client';
import React, { useState } from 'react';
import { InfoCircle, ExclamationTriangle, X, EyeFill, CameraVideo, ChevronRight } from "react-bootstrap-icons";
import { useCampaignBuilder } from '../data/CampaignBuilderContext';
import { AmazonAssetsModal } from '../modals/AmazonAssetsModal';
import { Toggle } from "../../ui/Toggle";

const CreativeField = ({
    label,
    info,
    children,
    errors,
    showToggle = false,
    isToggled = true,
    onToggleChange
}: {
    label: string,
    info?: string,
    children: React.ReactNode,
    errors?: string[],
    showToggle?: boolean,
    isToggled?: boolean,
    onToggleChange?: (val: boolean) => void
}) => (
    <div className={`flex flex-col gap-2 p-6 border border-[#e2e2e2] rounded-lg mb-4 bg-white shadow-sm transition-all ${!isToggled ? 'opacity-80' : ''}`}>
        <div className="flex items-center gap-3 font-bold text-gray-900 mb-1">
            {showToggle && (
                <Toggle checked={isToggled} onChange={onToggleChange || (() => {})} />
            )}
            <span className="text-xl">{label}</span>
            {info && <InfoCircle size={14} className="text-gray-400 cursor-help" title={info} />}
        </div>

        {isToggled && (
            <div className="flex items-start gap-4 mt-2">
                <div className="flex-1">
                    {children}
                    {errors && errors.map((err, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[#d93025] text-[12px] mt-1.5">
                            <ExclamationTriangle size={12} /> {err}
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

export const CreativesSection = () => {
    const { adType, strategy, adFormat, creatives, setCreatives } = useCampaignBuilder();
    const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);
    const [activeTarget, setActiveTarget] = useState<'logo' | 'media' | null>(null);

    const isFlagship = strategy === 'Flagship Collection';
    const isCustom = strategy === 'Custom';
    const isVideoFormat = adFormat === 'video';
    const isStoreSpotlight = adFormat === 'store-spotlight';
    const isSD = adType === 'Sponsored Display';

    // Logic for headers/media visiblity
    const showHeaderFields = !( (isFlagship || isCustom) && isVideoFormat && !isSD );
    const showMediaFields = !isStoreSpotlight && (isSD || (strategy !== 'Brand Awareness' || !isVideoFormat));

    // For Video ad format, we show Video creative instead of Image
    const isOnlyVideoMedia = ( (strategy === 'Brand Awareness' || isFlagship || isCustom) && isVideoFormat ) || (isSD && isVideoFormat);

    const handleOpenAssets = (target: 'logo' | 'media') => {
        setActiveTarget(target);
        setIsAssetsModalOpen(true);
    };

    const handleAssetSelect = (asset: any) => {
        if (activeTarget === 'logo') {
            setCreatives({ ...creatives, logo: asset.url });
        } else if (activeTarget === 'media') {
            if (isOnlyVideoMedia) {
                setCreatives({ ...creatives, video: asset.url });
            } else {
                const newImages = [...creatives.images, asset.url].slice(0, 5);
                setCreatives({ ...creatives, images: newImages });
            }
        }
    };

    const updateToggle = (field: 'logo' | 'headline' | 'media', val: boolean) => {
        setCreatives({
            ...creatives,
            toggles: { ...creatives.toggles, [field]: val }
        });
    };

    return (
        <>
            <div id="creatives" className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-[#e2e2e2] font-bold text-gray-900 text-lg">
                    Creatives
                </div>
                <div className="p-6 flex flex-col">

                    {showHeaderFields && (
                        <>
                            {/* Logo Field */}
                            <CreativeField
                                label="Logo"
                                info="Add your brand logo"
                                errors={["Logo required."]}
                                showToggle={isSD}
                                isToggled={isSD ? creatives.toggles.logo : true}
                                onToggleChange={(v) => updateToggle('logo', v)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handleOpenAssets('logo')}
                                            className="text-[#4aaada] border border-[#d0e3f5] rounded px-4 py-2 text-sm font-medium hover:bg-blue-50 bg-white"
                                        >
                                            Select from Amazon assets
                                        </button>
                                        <span className="text-sm text-gray-400 font-medium">or</span>
                                        <button className="text-[#4aaada] text-sm font-medium hover:underline">
                                            Upload Logo
                                        </button>
                                    </div>

                                    <div className="relative w-20 h-20 border border-gray-100 rounded-lg p-2 bg-white shadow-sm flex items-center justify-center">
                                        <img src={creatives.logo || "https://via.placeholder.com/60"} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                                        {creatives.logo && (
                                            <button
                                                onClick={() => setCreatives({ ...creatives, logo: '' })}
                                                className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-0.5 text-gray-500 hover:text-red-500 shadow-sm"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </CreativeField>

                            {/* Brand Name Field (Only for non-SD or if specifically requested, user image for SD shows Logo, Headline, Image) */}
                            {!isSD && (
                                <CreativeField
                                    label="Brand name"
                                    info="Your visible brand name"
                                    errors={["30 characters max.", "Brand name required."]}
                                >
                                    <input
                                        type="text"
                                        className="w-full border border-[#4aaada] rounded px-3 py-2 text-sm outline-none"
                                        value={creatives.brandName}
                                        onChange={(e) => setCreatives({ ...creatives, brandName: e.target.value })}
                                    />
                                </CreativeField>
                            )}

                            {/* Headline Field */}
                            <CreativeField
                                label="Headline"
                                info="Ads headline"
                                errors={["50 characters max.", "Headline required."]}
                                showToggle={isSD}
                                isToggled={isSD ? creatives.toggles.headline : true}
                                onToggleChange={(v) => updateToggle('headline', v)}
                            >
                                <input
                                    type="text"
                                    placeholder="Enter headline..."
                                    className="w-full border border-[#4aaada] rounded px-3 py-2 text-sm outline-none"
                                    value={creatives.headline}
                                    onChange={(e) => setCreatives({ ...creatives, headline: e.target.value })}
                                />
                            </CreativeField>
                        </>
                    )}

                    {showMediaFields && (
                        <CreativeField
                            label={isOnlyVideoMedia ? "Video" : "Image"}
                            info={isOnlyVideoMedia ? "Add brand/product video" : "Add product images"}
                            errors={isOnlyVideoMedia
                                ? ["Video required."]
                                : ["Image required."]
                            }
                            showToggle={isSD}
                            isToggled={isSD ? creatives.toggles.media : true}
                            onToggleChange={(v) => updateToggle('media', v)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleOpenAssets('media')}
                                        className="text-[#4aaada] border border-[#d0e3f5] rounded px-4 py-2 text-sm font-medium hover:bg-blue-50 bg-white"
                                    >
                                        Select from Amazon assets
                                    </button>
                                    <span className="text-sm text-gray-400 font-medium">or</span>
                                    <button className="text-[#4aaada] text-sm font-medium hover:underline">
                                        {isOnlyVideoMedia ? "Upload Video" : "Upload Image"}
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    {isOnlyVideoMedia ? (
                                        <div className="relative w-24 h-16 border border-gray-100 rounded-lg bg-[#f0f2f5] shadow-sm flex items-center justify-center text-gray-400 overflow-hidden">
                                            {creatives.video ? (
                                                <div className="w-full h-full flex items-center justify-center bg-black text-white text-[10px]">VIDEO</div>
                                            ) : (
                                                <CameraVideo size={24} />
                                            )}
                                            {creatives.video && (
                                                <button
                                                    onClick={() => setCreatives({ ...creatives, video: null })}
                                                    className="absolute -top-1.5 -right-1.5 bg-white border border-gray-100 rounded-full p-0.5 text-gray-500 hover:text-red-500 shadow-sm z-10"
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {creatives.images.length > 0 ? (
                                                <div className="relative w-16 h-16 border border-gray-100 rounded-lg bg-white shadow-sm flex items-center justify-center overflow-hidden">
                                                    <img src={creatives.images[0]} alt="Product preview" className="max-w-full max-h-full object-cover rounded-sm" />
                                                    <button
                                                        onClick={() => setCreatives({ ...creatives, images: [] })}
                                                        className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 text-gray-500 hover:text-red-500 shadow-sm z-10"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="relative w-16 h-16 border border-gray-100 rounded-lg bg-gray-50 shadow-sm flex items-center justify-center opacity-30">
                                                    <img src="https://via.placeholder.com/50?text=IMG" alt="placeholder" className="max-w-full max-h-full object-cover rounded-sm grayscale" />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </CreativeField>
                    )}

                    {/* Ad Preview Button */}
                    <div className="py-2 flex justify-center">
                        <button className="bg-[#2e5aa0] hover:bg-[#254982] text-white px-8 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors">
                            <EyeFill size={18} /> Ad Preview
                        </button>
                    </div>

                </div>
            </div>

            <AmazonAssetsModal
                isOpen={isAssetsModalOpen}
                onClose={() => setIsAssetsModalOpen(false)}
                onApply={handleAssetSelect}
                filterType={activeTarget === 'logo' ? 'Logo' : (isOnlyVideoMedia ? 'Video' : 'Image')}
            />
        </>
    );
};
