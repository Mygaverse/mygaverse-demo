import { Modal } from '@/components/bqool/ui/Modal';
import { Button } from '@/components/bqool/ui/Button';
import { Check } from 'react-bootstrap-icons';

export const Step1Intro = ({ onNext }: { onNext: () => void }) => (
  <Modal isOpen={true} onClose={() => {}} title="Connect to Amazon Account" width="max-w-4xl" headerStyle='branding'>
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to BQool Advertising!</h2>
      <p className="text-gray-500 mb-8">Lets get started by connecting BQool to both of your Amazon advertising and seller account.</p>

      <div className="space-y-4 max-w-xl mx-auto text-left">
        {/* Step 1 Card */}
        <div className="border border-blue-400 bg-blue-50 p-4 rounded-lg relative">
            <span className="absolute top-4 right-4 text-xs font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Required</span>
            <h3 className="font-bold text-gray-900 mb-1">Step 1: Connect to Amazon Advertising Account</h3>
            <p className="text-md text-gray-600">This step authorize BQool to download your Amazon advertising data. Such as campaigns and search terms.</p>
        </div>

        {/* Step 2 Card (Disabled look) */}
        <div className="border border-gray-200 bg-gray-50 p-4 rounded-lg opacity-60">
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
            Connect to Amazon Advertising Account
        </Button>
        <p className="text-xs text-gray-400 mt-2">You must have admin access to Amazon Seller Central account.</p>
      </div>
    </div>
  </Modal>
);