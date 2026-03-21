"use client";

import { useRouter } from 'next/navigation';
import { Speedometer, QuestionCircleFill, GlobeAmericas, PersonCircle, Facebook, Instagram, Youtube, Twitter, Linkedin, CreditCard, BoxArrowRight, Person, Link, People, ShieldLockFill } from 'react-bootstrap-icons';
import { SimplePopover } from '../ui/SimplePopover';
import { LogoAdvertising } from '../ui/Logo';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';


export function Topbar() {
  const router = useRouter();
  const { user } = useAuth();
  // Helper: Check if user is admin
  // Use safe check incase role is missing or uppercase
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // DEFINE LOGOUT HANDLER
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirect to the root login page
      window.location.href = "/"; 
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="bg-white fixed top-0 left-0 right-0 h-[60px] px-5 flex items-center justify-between shadow-sm z-[1000]">
      {/* Logo Area */}
      <div className="flex items-center gap-5">
        <a href="#" className="hover:opacity-80 transition-opacity">
            {/* The new SVG Component */}
            <LogoAdvertising />
        </a>
      </div>

      <div className="flex items-center gap-4">

        {/* ADMIN BUTTON (Only visible to Admins) */}
        {isAdmin && (
            <a 
              href="/demo/im" 
              className="flex items-center gap-2 px-3 py-1.5 bg-[#f1f7ff] text-[#0066b7] rounded-md hover:[#eef2f7] transition-colors mr-2"
              title="Go to Admin Panel"
            >
              <ShieldLockFill size={24} />
              <span className="text-sm font-bold">IM</span>
            </a>
        )}
        

      {/* Right side icons */}
      <div className="flex items-center gap-6">
        {/* Usage / Speedometer */}
        <SimplePopover
          align="right"
          width='w-[380px]'
          trigger={<button className="text-[#0066b7] hover:opacity-80"><Speedometer size={24} /></button>}
          content={
            <div className="flex flex-col">
                {/* Header */}
                <div className="p-3 border-b border-[#e2e2e2]">
                  <h3 className="text-[14px] text-[#212529] font-bold">Ad Spend Details</h3>
                </div>

                <div className="flex items-center justify-between p-3 border-b border-[#e2e2e2]">
                    <span className="text-[14px] text-[#212529]">Billing Period:</span>
                    <span className="text-[14px] text-[#212529]">10/1/2025 - 10/31/2025</span>
                  </div>

                {/* Details 1 */}
                <div className="p-3 flex flex-col gap-3 border-b border-[#e2e2e2]">
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#212529]">Monthly Ad Spend Included:</span>
                    <span className="text-[14px] text-[#212529]">$5,000</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#212529]">Current Ad Spend Amount:</span>
                    <span className="text-[14px] text-[#212529]">$6,000</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#212529]">Remaining Ad Spend Included:</span>
                    <span className="text-[14px] text-[#212529]">$0</span>
                  </div>
                </div>

                <div className="p-3 flex flex-col gap-3 border-b border-[#e2e2e2]">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#212529]">Ad Spend Overage Amount:</span>
                    <span className="text-[14px] text-[#212529]">$1,000</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#212529]">Ad Spend Overage Rate:</span>
                    <span className="text-[14px] text-[#212529]">2%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#212529]">Ad Spend Overage Fee:</span>
                    <span className="text-[14px] text-[#212529]">$10</span>
                  </div>
                </div>

                <div className="p-3 flex flex-col gap-3">
                  <div className="mt-2">
                    <a href="#" className="text-[14px] text-[#0066B7] font-bold hover:underline">
                      View Subscriptions
                    </a>
                  </div>
                </div>
              </div>
          }
        />

        {/* Help */}
        <SimplePopover
          align="right"
          width='w-[380px]'
          trigger={<button className="text-[#0066b7] hover:opacity-80"><QuestionCircleFill size={24} /></button>}
          content={
            <div className="flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-[#e2e2e2]">
                  <h3 className="text-[14px] text-[#212529] font-bold">Help</h3>
                </div>

                {/* Menu Items */}
                <div className="flex flex-col">
                  <button className="px-3 py-3 hover:bg-gray-50 text-left border-b border-[#e2e2e2] transition-colors">
                    <div className="text-[14px] text-[#212529]">Support</div>
                    <div className="text-[12px] text-[#ababab]">Search Knowledge Base</div>
                  </button>

                  <button className="px-3 py-3 hover:bg-gray-50 text-left border-b border-[#e2e2e2] transition-colors">
                    <div className="text-[14px] text-[#212529]">Learn With Us</div>
                    <div className="text-[12px] text-[#ababab]">Watch Video Tutorial</div>
                  </button>

                  <button className="px-3 py-3 hover:bg-gray-50 text-left border-b border-[#e2e2e2] transition-colors">
                    <div className="text-[14px] text-[#212529]">Chat with Support</div>
                    <div className="text-[12px] text-[#ababab]">Send Your Questions</div>
                  </button>

                  <button className="px-3 py-3 hover:bg-gray-50 text-left border-b border-[#e2e2e2] transition-colors">
                    <a href="#" className="text-[14px] text-[#0066B7] hover:underline">Getting Started with BQool Advertising</a>
                  </button>
                </div>

                {/* Social Media Icons */}
                <div className="flex items-center justify-between gap-4 p-4">
                  <a href="#" className="text-[#0066B7] hover:opacity-80 transition-opacity">
                    <Facebook className="w-6 h-6" fill="currentColor" />
                  </a>
                  <a href="#" className="text-[#0066B7] hover:opacity-80 transition-opacity">
                    <Instagram className="w-6 h-6" />
                  </a>
                  <a href="#" className="text-[#0066B7] hover:opacity-80 transition-opacity">
                    <Youtube className="w-6 h-6" fill="currentColor" />
                  </a>
                  <a href="#" className="text-[#0066B7] hover:opacity-80 transition-opacity">
                    <Twitter className="w-6 h-6" fill="currentColor" />
                  </a>
                  <a href="#" className="text-[#0066B7] hover:opacity-80 transition-opacity">
                    <Linkedin className="w-6 h-6" fill="currentColor" />
                  </a>
                </div>
              </div>
          }
        />

        {/* Language */}
        <SimplePopover
          align="right"
          width='w-[180px]'
          trigger={<button className="text-[#0066b7] hover:opacity-80"><GlobeAmericas size={24} /></button>}
          content={
            <div className="flex flex-col">
                <button className="px-4 py-3 text-left hover:bg-gray-50 text-[14px] text-[#212529] border-b-2 border-[#4aaada] transition-colors cursor-pointer">
                  English
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 text-[14px] text-[#212529] transition-colors cursor-pointer">
                  繁體中文
                </button>
                <button className="px-4 py-3 text-left hover:bg-gray-50 text-[14px] text-[#212529] transition-colors cursor-pointer">
                  简体中文
                </button>
              </div>
          }
        />

        {/* Profile */}
        <SimplePopover
          align="right"
          trigger={<button id="tour-topbar" className="text-[#0066b7] hover:opacity-80"><PersonCircle size={24} /></button>}
          content={
            <div id="tour-trial-status" className="flex flex-col text-sm">
              <div className="p-4 flex flex-col items-center border-b">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-2">
                   <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop" className="w-full h-full object-cover" />
                </div>
                <div className="font-bold">Peter Smith</div>
                <div className="text-gray-500 text-xs">peter.smith@gmail.com</div>
              </div>
              <button
                onClick={() => router.push('/account/profile')} 
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                  <Person size={16} color='#0066B7'/> Profile
              </button>
              <button 
                onClick={() => router.push('/account/billing')} 
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                  <CreditCard size={16} color='#0066B7'/> Billing
              </button>
              <button 
                onClick={() => router.push('/account/connections')} 
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                  <Link size={16} color='#0066B7'/> Connections
              </button>
              <button 
                onClick={() => router.push('/account/users')} 
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                  <People size={16} color='#0066B7'/> Users
              </button>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left text-red-500 border-t">
                  <BoxArrowRight size={16}/> Log out
              </button>


            </div>
          }
        />
      </div>
      </div>
    </div>
  );
}