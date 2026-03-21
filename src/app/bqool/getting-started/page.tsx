'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CameraReels, CurrencyDollar, ShieldCheck, GraphUp, PieChart, BarChartLine, PlayCircleFill } from 'react-bootstrap-icons';
const StartHero = { src: '/start_hero.png' };
import { OnboardingWizard } from '@/components/bqool/onboarding/OnboardingWizard';

import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { db } from '@/lib/bqool/firebase';              // Import your DB instance
import { useAuth } from '@/app/bqool/context/AuthContext'; // Import Auth

import { DashboardShell } from '@/components/bqool/layout/DashboardShell';

// --- DRIVER.JS IMPORTS ---
import { driver } from "driver.js"; 
import "driver.js/dist/driver.css";

export default function GettingStartedPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(true); // Add local loading state
  const router = useRouter();

  // Track if we should run the tour (only run if wizard was just completed)
  const [shouldRunTour, setShouldRunTour] = useState(false);

  // Logic: Automatically open wizard if user is NOT onboarded
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // 1. Wait for Auth to initialize
      if (authLoading) return;

      // 2. If no user, stop (or redirect to login)
      if (!user) {
         setCheckingStatus(false);
         return;
      }

      try {
        // 3. FETCH THE REAL FIRESTORE DATA
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          // 4. Check the flag. If missing or false, OPEN WIZARD
          if (!userData.onboarded) {
             setIsWizardOpen(true);
             // If we open the wizard, we plan to run the tour after it closes
             setShouldRunTour(true);
          }
        } else {
          // Edge case: User logged in but has no Firestore doc? Open wizard safely.
          setIsWizardOpen(true);
          setShouldRunTour(true);
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkOnboardingStatus();
  }, [user, authLoading]);

  // --- The Tour Logic ---
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: false,
      steps: [
        { 
          element: '#tour-welcome-hero', 
          popover: { 
            title: 'Welcome to your BQool Advertising Demo!', 
            description: 'This is your starting point. Here you can find quick overview of the interface and navigation tips.', 
            side: "bottom", 
            align: 'start' 
          } 
        },
        { 
          element: '#tour-feature-list', 
          popover: { 
            title: 'Video Guides for Key Features', 
            description: 'Explore our AI Bidding, Harvesting, and Reporting tools. Click "Watch Video" to learn how each one works.', 
            side: "top", 
            align: 'start' 
          } 
        },
        { 
          element: '#tour-sidebar', 
          popover: { 
            title: 'Navigation Sidebar', 
            description: 'Use the sidebar to switch between your Dashboard, Ad Manager, Budget Manager, Campaign Builder and Ad History.', 
            side: "right", 
            align: 'start' 
          },
          // 1. Force Expand on Start
          onHighlightStarted: (element) => {
             if (!element) return;
             // Dispatch a mouseover event to trigger your React onMouseEnter or CSS :hover
             const event = new MouseEvent('mouseover', {
                'view': window,
                'bubbles': true,
                'cancelable': true
             });
             element.dispatchEvent(event);
          },
          // 2. Force Collapse on Exit
          onDeselected: (element) => {
             if (!element) return;
             const event = new MouseEvent('mouseleave', {
                'view': window,
                'bubbles': true,
                'cancelable': true
             });
             element.dispatchEvent(event);
          } 
        },
        { 
          element: '#tour-topbar',
          popover: { 
            title: 'Navigation Topbar', 
            description: 'Access your Profile, Billing, Connections, and User Management from here.', 
            side: "left", 
            align: 'start' 
          } 
        },
        { 
          element: '#tour-end-hero',
          popover: { 
            title: 'You\'re All Set!', 
            description: 'Explore the demo dashboard and start managing your advertising campaigns with BQool Advertising.', 
            side: "left", 
            align: 'start' 
          } 
        }
      ]
    });

    driverObj.drive();
  };

  // --- Handle Wizard Close ---
  const handleWizardClose = () => {
      setIsWizardOpen(false);
      
      // If the user just finished onboarding, start the tour
      if (shouldRunTour) {
          // Small delay to allow the modal to disappear completely
          setTimeout(() => {
              startTour();
          }, 500);
      }
  };

  return (
    <DashboardShell>
      <div className="min-h-full bg-gray-50/50 p-8 font-sans">
        
        {/* Main Container */}
        <div className="max-w-5xl mx-auto">
            
            {/* Hero Section */}
            <div className="flex items-center justify-center text-center mb-10 pt-4">
                {/* Illustration Placeholder - You can replace this with your SVG/Image */}
                <div className="mr-6 relative">
                    {/* Simple CSS shape to mimic the 'Lightbulb/Box' illustration in your image */}
                    <div className="w-40 h-32 bg-blue-100 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
                    <img 
                        src={StartHero.src} 
                        alt="Getting Started Illustration"
                        className="w-64 h-auto relative z-10"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'; // Hide if missing
                        }} 
                    />
                    
                </div>

                <div className='flex flex-col items-center'>
                  <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                      Getting Started with BQool Advertising
                  </h1>

                  {/* Manual Tour Trigger */}
                  <button 
                      onClick={startTour} 
                      className="mt-4 text-sm text-[#4aaada] hover:underline flex items-center gap-1"
                  >
                      <PlayCircleFill /> Replay Guide Tour
                  </button>
                </div>
                
            </div>

            {/* Feature Cards List */}
            <div id="tour-feature-list" className="space-y-4">
                
                <FeatureRow 
                    icon={<CurrencyDollar className="text-2xl" />}
                    iconBg="bg-blue-100 text-blue-600"
                    title="AI-Powered Bidding"
                    desc="Activate AI-driven bidding to reduce ACOS and enhance overall campaign performance through smarter bid adjustments."
                />

                <FeatureRow 
                    icon={<ShieldCheck className="text-2xl" />}
                    iconBg="bg-blue-100 text-blue-600"
                    title="Automated Keyword & Product Harvesting"
                    desc="Enable automated harvesting to identify and add high-performing keywords and ASINs directly to your ad groups for improved targeting and performance."
                />

                <FeatureRow 
                    icon={<BarChartLine className="text-2xl" />}
                    iconBg="bg-blue-100 text-blue-600"
                    title="Automated Budgeting"
                    desc="Enable Budget Manager to activate real-time budget pacing, keeping top-performing campaigns funded and preventing early exhaustion."
                />

                <FeatureRow 
                    icon={<GraphUp className="text-2xl" />}
                    iconBg="bg-blue-100 text-blue-600"
                    title="Campaign Builder"
                    desc="Quickly create ad campaigns using pre-defined structures designed to boost AI bidding performance and optimize automated keyword and product harvesting."
                />

                <FeatureRow 
                    icon={<PieChart className="text-2xl" />}
                    iconBg="bg-blue-100 text-blue-600"
                    title="Dashboard Reporting"
                    desc="Get instant access to key metrics in one place. Customize date range, metrics, company logo, and comments—then export your report as a PDF."
                />

            </div>
        </div>

        {/* Wizard Modal */}
        {!checkingStatus && (
            <OnboardingWizard 
                isOpen={isWizardOpen} 
                onClose={handleWizardClose} 
            />
        )}
        
      </div>
    </DashboardShell>
    
  );
}

// --- Sub-Component for the Rows ---
function FeatureRow({ icon, iconBg, title, desc }: { icon: React.ReactNode, iconBg: string, title: string, desc: string }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center shadow-sm hover:shadow-md transition-shadow">
            {/* Icon Circle */}
            <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center shrink-0 mr-6`}>
                {icon}
            </div>

            {/* Text Content */}
            <div className="flex-1 mr-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>

            {/* Action Button */}
            <button className="shrink-0 flex items-center gap-2 bg-[#4aaada] hover:bg-[#3a9aca] text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm">
                <CameraReels className="text-lg" /> 
                <span>Watch Video</span>
            </button>
        </div>
    );
}