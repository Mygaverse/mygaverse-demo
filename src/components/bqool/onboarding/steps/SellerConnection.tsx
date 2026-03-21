import React, { useState } from 'react';
import { Modal } from '@/components/bqool/ui/Modal';
import { Button } from '@/components/bqool/ui/Button';
import { ArrowRight, CheckCircleFill, ExclamationCircleFill, Link45deg } from 'react-bootstrap-icons';

export const Step2ConnectSeller = ({ selectedStores, onNext }: { selectedStores: any[], onNext: () => void }) => {
    // Track connection status for each store ID
    const [connectionStatus, setConnectionStatus] = useState<Record<string, 'pending' | 'connected'>>({});
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleConnect = (storeId: string) => {
        setLoadingId(storeId);
        // Simulate API delay
        setTimeout(() => {
            setConnectionStatus(prev => ({ ...prev, [storeId]: 'connected' }));
            setLoadingId(null);
        }, 800);
    };

    const allConnected = selectedStores.every(s => connectionStatus[s.id] === 'connected');

    return (
        <Modal isOpen={true} onClose={() => {}} title="Connect to Amazon Seller Account" width="max-w-4xl" headerStyle='branding'>
            <div className="p-6">
                <p className="mb-4 text-sm text-gray-600">
                    Connect the Seller Central account for the stores selected previously to enable product harvesting and detailed sales metrics.
                </p>

                <div className="border rounded-lg overflow-hidden mb-6">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3">Marketplace</th>
                                <th className="p-3">Store Name</th>
                                <th className="p-3">Store ID</th>
                                <th className="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedStores.map((store) => {
                                const isConnected = connectionStatus[store.id] === 'connected';
                                return (
                                    <tr key={store.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 flex items-center gap-2 mt-2">
                                            <img 
                                                src={`https://flagcdn.com/w20/${store.marketplace.toLowerCase()}.png`} 
                                                alt={store.marketplace} 
                                                className="w-5 h-3.5 object-cover rounded-[1px]" 
                                            />
                                            <span className="font-bold">Amazon {store.marketplace}</span>
                                        </td>
                                        <td className="p-3">{store.name}</td>
                                        <td className="p-3 text-gray-500 font-mono text-sm">{store.id}</td>
                                        <td className="p-3 text-center">
                                            {isConnected ? (
                                                <span className="flex items-center justify-center gap-2 text-green-600 font-bold text-xs animate-in fade-in">
                                                    <CheckCircleFill /> Connected
                                                </span>
                                            ) : (
                                                <Button
                                                    variant="primary"
                                                    size="sm" 
                                                    onClick={() => handleConnect(store.id)}
                                                    disabled={loadingId === store.id}
                                                    className="min-w-[100px]"
                                                    icon={<Link45deg size={16} />}
                                                >
                                                    {loadingId === store.id ? 'Connecting...' : 'Connect'}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-center gap-2">
                    {/* Disable Continue until all are connected */}
                    <Button 
                        variant="primary" 
                        onClick={onNext} 
                        disabled={!allConnected}
                        icon={<ArrowRight size={18} className="text-white" />}
                    >
                        {allConnected ? 'Continue' : 'Connect All to Continue'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};