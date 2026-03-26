// src/app/waitlist-pending/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/scriptoplay/ui/Button';
import { useAuth } from '@/app/scriptoplay/context/AuthContext';
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

export default function WaitlistPendingPage() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
          <Image src="/images/auth-background.png" alt="bg" fill className="object-cover opacity-20" />
      </div>

      <div className="relative z-10 max-w-md w-full p-8 bg-[#0a0a0a] border border-[#262626] rounded-2xl shadow-2xl text-center">
        
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-purple-900/20 border border-purple-500/30 rounded-full flex items-center justify-center mb-6">
           <Icon icon={ICONS.clock} size={32} className="text-purple-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Access Pending</h1>
        <p className="text-gray-400 text-sm mb-6">
           Hi <strong>{user?.displayName}</strong>, thanks for joining Scriptoplay. 
           We are currently in <strong>Closed Beta</strong>.
        </p>

        <div className="bg-[#141414] rounded-lg p-4 mb-8 text-left border border-[#262626]">
           <div className="flex items-start gap-3">
              <Icon icon={ICONS.info} size={16} className="text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-300 leading-relaxed">
                 Your account has been created and is on our priority waitlist. 
                 You will receive an email immediately once an Admin approves your access to the Dashboard.
              </p>
           </div>
        </div>

        <div className="flex flex-col gap-3">
           <Link href="/">
             <Button variant="primary" className="w-full">Back to Home</Button>
           </Link>
           <button 
             onClick={signOut} 
             className="text-xs text-gray-500 hover:text-white transition-colors underline-offset-4 hover:underline"
           >
             Sign Out
           </button>
        </div>
      </div>

      <div className="absolute bottom-6 text-xs text-gray-600">
        &copy; 2025 Scriptoplay. All rights reserved.
      </div>
    </div>
  );
}