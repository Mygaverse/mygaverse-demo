'use client';

import React from 'react';
import CartoonDiscoveryWizard from '@/components/scriptoplay/dashboard/create-cartoon/CartoonDiscoveryWizard';

export default function CreateCartoonPage() {
  return (
    <div className="w-full h-full flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 bg-[#0a0a0a]">
      <CartoonDiscoveryWizard />
    </div>
  );
}
