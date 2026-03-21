import React from 'react';
import { Badge } from "../../../ui/Badge";
import { ColumnDef } from "../../../tables/DynamicTable";
import { ProductInfoCell } from "../../../tables/cells/ProductInfoCell";
import { EntityCell } from "../../../tables/cells/EntityCell";

export interface SPGoalModalUnifiedRow {
  campaignName: string;
  campaignType: string;
  campaignStatus: string;
  storeName: string;
  storeFlag: string;
  adStatus: string;
  productName: string;
  productImage: string;
  asin: string;
  sku: string;
}

export const getGoalModalUnifiedColumns = (): ColumnDef<SPGoalModalUnifiedRow>[] => {

    const COL_WIDTH = '460px';
    return [
        // Column 1: Campaigns (Reusing EntityCell layout from other tabs)
        { 
            key: 'campaign', header: 'Campaigns', width: '40%', // Use percentage for even split in modal
            render: (row) => (
                // Added max-w wrapper to prevent column blowout
                <div style={{ width: COL_WIDTH }} className="whitespace-normal">
                    <EntityCell 
                        title={row.campaignName}
                        badges={[
                            // Store Badge
                            <div key="store" className="flex items-center gap-1 bg-white border border-[#e2e2e2] rounded-full px-2 py-0.5">
                                <img src={`https://flagcdn.com/w20/${row.storeFlag}.png`} alt={row.storeFlag} className="w-3.5 h-2.5 rounded-[1px]" />
                                <span className="text-[10px] text-gray-600">{row.storeName}</span>
                            </div>,
                            // Type Badge
                            <Badge key="t" variant="type">{row.campaignType}</Badge>,
                            // Status Badge
                            <Badge key="s" variant={row.campaignStatus === 'Enabled' ? 'status-enabled' : 'neutral'}>{row.campaignStatus}</Badge>
                        ]}
                    />
                </div>
                
            )
        },
        // Column 2: Product Ads (Using ProductInfoCell)
        { 
            key: 'product', header: 'Product Ads', width: '60%',
            render: (row) => (
                // Combine Status badge directly with the product info cell for this view
                <div style={{ width: COL_WIDTH }}className="flex items-start gap-2">
                     <div className="mt-1">
                        <Badge variant={row.adStatus === 'Enabled' ? 'status-enabled' : 'neutral'}>{row.adStatus}</Badge>
                     </div>
                     <ProductInfoCell 
                        imageSrc={row.productImage}
                        title={row.productName}
                        asin={row.asin}
                        sku={row.sku}
                     />
                </div>
            )
        },
    ];
};