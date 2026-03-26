import React from 'react';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

export default function AffiliateSection() {
  return (
    <>
      <div className="flex justify-start mb-4">
        <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center text-3xl">
          🎁
        </div>
      </div>

      <div className="text-center md:text-left mb-6">
        <h3 className="text-xl text-white mb-3">Invite your friends and earn lifelong recurring commissions. 💸</h3>
        <p className="text-sm text-gray-400 mb-2">
          Simply share your referral link and have your friends sign up through it.
        </p>
        <div className="flex justify-between md:justify-start md:gap-12">
          <div>
            <div className="text-xs text-gray-400 mb-1">Commission Rate:
            <span className="text-sm text-white font-bold ml-2">10%</span></div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Referral Program
            <span className="text-sm text-white font-bold ml-2">All Purchases</span></div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-[#0f0f0f] border border-[#262626] rounded-xl p-3 hover:border-gray-600 transition-colors group">
        <span className="text-sm text-gray-400">Earnings</span>
        <span className="text-2xl text-white font-bold">$380</span>
      </div>

      <div className="relative group pt-4">
        <input
          type="text"
          readOnly
          value="https://demo.magicproject.ai/register?aff=P60..."
          className="w-full bg-[#0f0f0f] border border-[#262626] rounded-lg px-4 py-3 text-sm text-gray-400 focus:outline-none pr-10 truncate"
        />
        <button className="absolute right-3 top-3/5 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
          <Icon icon={ICONS.copy} size={18} />
        </button>
      </div>
    </>
  );
}