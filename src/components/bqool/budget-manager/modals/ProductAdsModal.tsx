'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { Modal } from "../../ui/Modal";
import { Badge } from "../../ui/Badge";
import { Pagination } from "../../ui/Pagination";
import { Portal } from '@/components/bqool/ui/Portal';

interface ProductAdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: any; // The campaign object
}

export const ProductAdsModal = ({ isOpen, onClose, campaign }: ProductAdsModalProps) => {
  const [productAds, setProductAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

   // Check Type
  const isSB = campaign?.type === 'Sponsored Brands' || campaign?.type === 'SB';

  useEffect(() => {
    const fetchProductAds = async () => {
      if (!isOpen || !campaign?.id) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'product_ads'),
          where('campaignId', '==', campaign.id)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setProductAds(data);
      } catch (error) {
        console.error("Error fetching product ads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAds();
    // Reset pagination on open
    setCurrentPage(1);
  }, [isOpen, campaign]);

  const paginatedAds = productAds.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (!isOpen || !campaign) return null;

  return (
    <Portal>
      <Modal isOpen={isOpen} onClose={onClose} title="Product Ads" width="max-w-4xl" headerStyle="branding">

        {/* Campaign Header */}
        <div className="bg-gray-50 p-4 border-b border-[#e2e2e2]">
            {/* Campaign Header info */}
            <div className="font-medium text-lg text-gray-900 mb-2">{campaign.name}</div>
            <div className="flex gap-2">
                <div className="flex items-center gap-1 bg-white border border-[#e2e2e2] rounded-full px-2 py-0.5">
                    <img src={`https://flagcdn.com/w20/${campaign.flag || 'us'}.png`} alt={campaign.flag} className="w-3.5 h-2.5 rounded-[1px]" />
                    <span className="text-[10px] text-gray-600">{campaign.storeName}</span>
                </div>
                <Badge variant="neutral">{campaign.type}</Badge>
                <Badge variant={campaign.status === 'Enabled' ? 'status-enabled' : 'neutral'}>{campaign.status}</Badge>
            </div>
        </div>
        <div className="p-6 bg-white">
            <div className="border border-[#e2e2e2] rounded-md overflow-hidden">
                <div className="px-4 py-3 bg-[#f1f7ff] border-b border-[#e2e2e2] font-medium text-gray-800">
                    Product Ads
                </div>
                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">Loading...</div>
                    ) : productAds.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No product ads found for this campaign.</div>
                    ) : (
                        paginatedAds.map(ad => (
                            <div key={ad.id} className="p-4 flex items-center gap-4">
                                {isSB ? (
                                    // --- SPONSORED BRANDS (Text Based) ---
                                    <div className="flex-1">
                                        {ad.sbAdText ? (
                                            <span className="text-sm text-gray-900 font-medium">{ad.sbAdText}</span>
                                        ) : (
                                            <Badge variant="neutral" size="sm">No Product Ad</Badge>
                                        )}
                                        {/* Optional: Show Landing Page URL below if available */}
                                        {ad.landingPage && (
                                            <div className="text-xs text-blue-600 mt-1 truncate max-w-md">{ad.landingPage}</div>
                                        )}
                                    </div>
                                ) : (
                                    // --- SP / SD LAYOUT (Standard Product) ---
                                    <>
                                        <img 
                                            src={ad.productImage || "https://placehold.co/60x60?text=No+Image"} 
                                            alt={ad.productName} 
                                            className="w-[60px] h-[60px] object-cover border border-[#e2e2e2] rounded-md"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900 text-sm mb-1 line-clamp-2" title={ad.productName}>{ad.productName}</div>
                                            <div className="text-xs text-gray-500 flex gap-3">
                                                <span><span className="font-medium text-blue-600">{ad.asin}</span></span>
                                                <span>SKU: <span className="font-medium text-gray-700">{ad.sku}</span></span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
             <div className="mt-4">
                <Pagination 
                    currentPage={currentPage} 
                    totalItems={productAds.length} 
                    pageSize={pageSize} 
                    onPageChange={setCurrentPage} 
                    onPageSizeChange={setPageSize} 
                />
            </div>
        </div>
      </Modal>
    </Portal>
  );
};