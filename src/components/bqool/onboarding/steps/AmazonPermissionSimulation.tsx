import React from 'react';
import { Button } from '@/components/bqool/ui/Button';

export const AmazonPermissionSimulation = ({ onAllow, onCancel }: { onAllow: () => void, onCancel: () => void }) => {
  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded shadow-2xl w-[400px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Fake Browser Header */}
        <div className="bg-[#232f3e] px-4 py-3 flex items-center justify-between shrink-0">
            <span className="text-white text-xs">Login with Amazon</span>
            <button onClick={onCancel} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="p-6 flex flex-col items-center overflow-y-auto">
          {/* Logos */}
          <div className="flex items-center gap-4 mb-6">
             <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" className="w-20" alt="Amazon" />
             <span className="text-gray-300 text-xl">⇄</span>
             <div className="text-xl font-bold text-[#0066b7]">BQool</div>
          </div>

          <div className="text-left w-full space-y-4">
            <h3 className="font-bold text-lg text-gray-900">BQool Advertising would like to access:</h3>
            
            <div className="border rounded p-3 bg-gray-50 text-sm space-y-2">
                <div className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">View and manage your advertising campaigns</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">Access campaign performance metrics</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span className="text-gray-700">View your product listings</span>
                </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
                By clicking Allow, you agree to Amazon's Conditions of Use and Privacy Notice.
            </p>
          </div>

          <div className="w-full flex gap-3 mt-8">
             <button 
               onClick={onCancel}
               className="flex-1 py-2 border border-gray-300 rounded shadow-sm text-sm hover:bg-gray-50"
             >
                Cancel
             </button>
             <button 
               onClick={onAllow}
               className="flex-1 py-2 bg-[#f0c14b] border border-[#a88734] rounded shadow-sm text-sm hover:bg-[#ddb347] font-medium"
             >
                Allow
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};