'use client';

import React from 'react';
import { Modal } from '@/components/bqool/ui/Modal'; // Adjust path as needed
import { Button } from '@/components/bqool/ui/Button'; // Adjust path as needed
import { X } from 'react-bootstrap-icons';

interface CurrencyRateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Hardcoded data from the screenshot
const CURRENCY_DATA = {
  lastUpdated: '02/15/2024',
  currencies: ['USD', 'CAD', 'EUR', 'GBP', 'JPY', 'MXN'],
  rates: [
    { base: 'USD 1 =', values: [1, 1.3814, 0.8943, 0.7932, 105.9658, 21.6820] },
    { base: 'CAD 1 =', values: [0.7239, 1, 0.6474, 0.5743, 79.7103, 15.6959] },
    { base: 'EUR 1 =', values: [1.1193, 1.5476, 1, 0.8889, 118.6710, 24.4343] },
    { base: 'GBP 1 =', values: [1.2593, 1.7412, 1.1251, 1, 133.2781, 27.4912] },
    { base: 'JPY 1 =', values: [0.0094, 0.0131, 0.0084, 0.0075, 1, 0.2062] },
    { base: 'MXN 1 =', values: [0.0458, 0.633, 0.0409, 0.0364, 4.8475, 1] },
  ]
};

export const CurrencyRateModal = ({ isOpen, onClose }: CurrencyRateModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Currency Rate"
      headerStyle="branding"
      width="max-w-4xl" // Wider for the table
    >
      <div className="p-6">
        {/* Last Updated Date */}
        <div className="text-right text-gray-500 text-sm mb-4">
          Last updated: {CURRENCY_DATA.lastUpdated}
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-sm text-center">
            {/* Header Row */}
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="p-4 border-b border-r border-gray-200 bg-white"></th> {/* Empty corner */}
                {CURRENCY_DATA.currencies.map((currency, index) => (
                  <th key={currency} className={`p-4 border-b border-gray-200 ${index !== CURRENCY_DATA.currencies.length - 1 ? 'border-r' : ''}`}>
                    {currency}
                  </th>
                ))}
              </tr>
            </thead>
            {/* Data Rows */}
            <tbody className="text-gray-900">
              {CURRENCY_DATA.rates.map((row, rowIndex) => (
                <tr key={row.base} className={rowIndex !== CURRENCY_DATA.rates.length - 1 ? 'border-b border-gray-200' : ''}>
                  <td className="p-4 font-medium border-r border-gray-200 bg-gray-50 text-left">
                    {row.base}
                  </td>
                  {row.values.map((value, colIndex) => (
                    <td key={colIndex} className={`p-4 ${colIndex !== row.values.length - 1 ? 'border-r border-gray-200' : ''}`}>
                      {value.toFixed(4)} {/* Format to 4 decimal places like screenshot */}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Action */}
        <div className="flex justify-center">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            className="flex items-center gap-2 px-4"
            icon={<X size={18} className="text-gray-600" />}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};