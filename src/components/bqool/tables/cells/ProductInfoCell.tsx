'use client';

import React from 'react';

interface ProductInfoCellProps {
  imageSrc: string;
  title: string;
  asin: string;
  sku: string;
  productLink?: string; // URL for the product/ID
}

export const ProductInfoCell = ({ 
  imageSrc, 
  title, 
  asin, 
  sku, 
  productLink = "#" 
}: ProductInfoCellProps) => {
  return (
    <div className="flex items-start gap-3 py-1">
      {/* Product Image */}
      <div className="w-[50px] h-[50px] shrink-0 border border-gray-200 rounded-md overflow-hidden bg-gray-50">
        <img 
            src={imageSrc} 
            alt={title} 
            className="w-full h-full object-contain" 
        />
      </div>

      {/* Product Details */}
      <div className="flex flex-col gap-0.5 min-w-0">
        {/* Title (Truncated 2 lines) */}
        <div 
            className="text-sm text-gray-900 font-medium leading-tight line-clamp-2 mb-1" 
            title={title}
        >
            {title}
        </div>
        
        {/* ID Link & SKU Row */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
           <a 
             href={productLink} 
             className="text-[#0066b7] hover:underline font-medium"
             onClick={(e) => e.stopPropagation()}
           >
             {asin}
           </a>
           <span className="text-gray-300">|</span>
           <span className="truncate max-w-[150px]" title={sku}>SKU: {sku}</span>
        </div>
      </div>
    </div>
  );
};