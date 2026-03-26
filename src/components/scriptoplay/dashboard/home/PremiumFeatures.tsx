import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import Button from '@/components/scriptoplay/ui/Button';

export default function PremiumFeatures() {
  const features = ['Unlimited Credits', 'Access to All Templates', 'External Chatbots', 'o1-mini and DeepSeek R1', 'Premium Support'];

  return (
    <>
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <p className="text-sm text-gray-400 mb-6 relative z-10">
        Upgrade your plan to unlock new AI capabilities.
      </p>
      
      <div className="space-y-4 mb-8 relative z-10 flex-1">
        {features.map((item) => (
          <div key={item} className="flex items-center gap-3">
            <div className="text-purple-400">
                <Icon icon={ICONS.check} size={20} />
            </div>
            <span className="text-sm text-gray-200">{item}</span>
          </div>
        ))}
      </div>

      <Button variant='primary'>
        Upgrade Your Plan
      </Button>
    </>
  );
}