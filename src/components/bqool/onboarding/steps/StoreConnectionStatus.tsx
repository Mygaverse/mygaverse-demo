import React from 'react';
import { Modal } from '@/components/bqool/ui/Modal';
import { Button } from '@/components/bqool/ui/Button';
import { Check, ExclamationCircleFill, ExclamationTriangleFill } from 'react-bootstrap-icons';

export const StoreConnectionStatus = ({ selectedStores, onConfirm }: { selectedStores: any[], onConfirm: () => void }) => {
  return (
    <Modal isOpen={true} onClose={() => {}} title="Connect to Amazon Advertising Account" width="max-w-4xl" headerStyle='branding'>
      <div className="p-6">
        <h3 className="font-bold text-gray-900 mb-4">Stores that Connect to Amazon Advertising Account</h3>

        <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm text-left">
                <thead className="bg-blue-50 border-b border-blue-100">
                    <tr>
                        <th className="p-3">Marketplace</th>
                        <th className="p-3">Store Name</th>
                        <th className="p-3">Store ID</th>
                        <th className="p-3">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {selectedStores.map((store) => (
                        <tr key={store.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="p-3 font-bold flex items-center gap-2">
                                <img 
                                    src={`https://flagcdn.com/w20/${store.marketplace.toLowerCase()}.png`} 
                                    alt={store.marketplace} 
                                    className="w-5 h-3.5 object-cover rounded-[1px]" 
                                />
                                <span className="font-bold">Amazon {store.marketplace}</span>
                            </td>
                            <td className="p-3">{store.name}</td>
                            <td className="p-3 text-gray-500 font-mono text-xs">{store.id}</td>
                            <td className="p-3">
                                <span className="flex items-center gap-2 text-green-600 font-bold text-xs">
                                    <Check className="text-lg" /> Connected
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded flex gap-2 items-start mb-6">
            <div className="mt-0.5"><ExclamationCircleFill size={16} className='text-[#4aaada]'/></div>
            <p className='text-sm'>
                If any store fails to connect, you can try again later from BQool Account &gt; Connections. 
                Click "Confirm" to proceed to the next step.
            </p>
        </div>

        <div className="flex justify-center">
            <Button 
                variant="primary" 
                onClick={onConfirm} className="px-4"
                icon={<Check size={24} className="text-white" />}
            >
                Confirm
            </Button>
        </div>
      </div>
    </Modal>
  );
};