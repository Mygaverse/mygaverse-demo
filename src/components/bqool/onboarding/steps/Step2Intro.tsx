import React from 'react';
import { Modal } from '@/components/bqool/ui/Modal';
import { Button } from '@/components/bqool/ui/Button';
import { Check, CheckCircleFill } from 'react-bootstrap-icons';

export const Step2Intro = ({ onNext }: { onNext: () => void }) => (
  <Modal isOpen={true} onClose={() => {}} title="Amazon Advertising Account Connected!" width="max-w-4xl" headerStyle='branding'>
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to BQool Advertising!</h2>
      <p className="text-gray-500 mb-8">Lets get started by connecting BQool to both of your Amazon advertising and seller account.</p>

      <div className="space-y-4 max-w-xl mx-auto text-left">
        
        {/* Step 1 Card - COMPLETED STATE */}
        <div className="border border-gray-200 bg-gray-100 p-4 rounded-lg relative opacity-70">
            <span className="absolute top-4 right-4 text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 flex items-center gap-1">
                <CheckCircleFill /> Connected
            </span>
            <h3 className="font-bold text-gray-700 mb-1">Step 1: Connect to Amazon Advertising Account</h3>
            <p className="text-md text-gray-500">This step authorize BQool to download your Amazon advertising data. Such as campaigns and search terms.</p>
        </div>

        {/* Step 2 Card - ACTIVE STATE */}
        <div className="border border-blue-500 bg-white p-4 rounded-lg relative shadow-md ring-2 ring-blue-100">
             <span className="absolute top-4 right-4 text-xs font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Required</span>
            <h3 className="font-bold text-gray-900 mb-1">Step 2: Connect to Amazon Seller Account</h3>
            <p className="text-md text-gray-600">This step authorize BQool to download your Amazon seller data. Such as products and others.</p>
        </div>
      </div>

      <div className="mt-8">
        <Button 
            variant="primary" 
            onClick={onNext} 
            className="w-full max-w-sm py-3 text-base"
            icon={<Check size={24} className="text-white" />}
          >
            Connect to Amazon Seller Account
        </Button>
        <p className="text-xs text-gray-400 mt-2">You must have admin access to Amazon Seller Central account.</p>
      </div>
    </div>
  </Modal>
);