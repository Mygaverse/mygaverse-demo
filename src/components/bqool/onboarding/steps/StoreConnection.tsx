import React, { useState } from 'react';
import { Modal } from '@/components/bqool/ui/Modal';
import { Button } from '@/components/bqool/ui/Button';
import { Check, X } from 'react-bootstrap-icons';

export const StoreSelector = ({ stores, onConfirm, onCancel }: any) => {
    const [selected, setSelected] = useState<string[]>([]);

    const toggle = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <Modal isOpen={true} onClose={onCancel} title="Connect to Amazon Advertising Account" width="max-w-3xl" headerStyle='branding'>
            <div className="p-6">
                <p className="mb-4 text-sm text-gray-800">Select one or multiple stores below:</p>
                
                <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto mb-6">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3 w-30"><input type="checkbox" className='w-4 h-4 border border-gray-800' /></th>
                                <th className="p-3">Marketplace</th>
                                <th className="p-3">Store Name</th>
                                <th className="p-3">Store ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.map((store: any) => (
                                <tr key={store.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">
                                        <input 
                                            type="checkbox"
                                            className='w-4 h-4 border border-gray-800' 
                                            checked={selected.includes(store.id)}
                                            onChange={() => toggle(store.id)}
                                        />
                                    </td>
                                    <td className="p-3 flex items-center gap-2">
                                        <img 
                                            src={`https://flagcdn.com/w20/${store.marketplace.toLowerCase()}.png`} 
                                            alt={store.marketplace} 
                                            className="w-5 h-3.5 object-cover rounded-[1px]" 
                                        />
                                        <span className="font-bold">Amazon {store.marketplace}</span>
                                    </td>
                                    <td className="p-3">{store.name}</td>
                                    <td className="p-3 text-gray-500 font-mono text-sm">{store.id}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-center gap-2">
                    <Button 
                        variant="ghostOutline" 
                        onClick={onCancel}
                        icon={<X size={20} /> } 
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={() => onConfirm(selected)} 
                        disabled={selected.length === 0}
                        icon={<Check size={20} /> }
                    >
                        Connect Selected
                    </Button>
                </div>
            </div>
        </Modal>
    );
};