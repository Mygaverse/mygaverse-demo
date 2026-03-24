'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlayCircle, Clock, PlayCircleFill } from 'react-bootstrap-icons';
import StartHero from '@/public/start_hero.png';
import { OnboardingWizard } from '@/components/bqool/onboarding/OnboardingWizard';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';
import { useAuth } from '@/app/bqool/context/AuthContext';

import { DashboardShell } from '@/components/bqool/layout/DashboardShell';
import { Button } from '@/components/bqool/ui/Button';
import { learnWorldClient, Course } from '@/lib/bqool/learnworld';


// --- DRIVER.JS IMPORTS ---
import { driver } from "driver.js";
import "driver.js/dist/driver.css";


export default function GettingStartedPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const router = useRouter();

  // Courses State
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  // Per-card loading state
  const [launchingCourseId, setLaunchingCourseId] = useState<string | null>(null);
  // Category tab state — derived from fetched courses
  const [activeTab, setActiveTab] = useState<string>('all');

  const [shouldRunTour, setShouldRunTour] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  const handleSSOLogin = async () => {
    if (!user) return;
    setSsoLoading(true);
    try {
      const url = await learnWorldClient.generateSSOUrl(
        user.email || '',
        user.uid,
        user.displayName || 'User'
      );
      window.open(url, '_blank');
    } catch (err) {
      console.error('SSO Error:', err);
      alert('Failed to initiate SSO: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSsoLoading(false);
    }
  };

  // --- Open course in a popup window (same pattern as CourseContextHeader) ---
  const handleCourseClick = async (course: Course) => {
    if (!user || launchingCourseId) return;
    setLaunchingCourseId(course.id);

    // 1. Open popup immediately (synchronous click — avoids popup blocker)
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
      '',
      'bqool_uni_player',
      `width=${width},height=${height},top=${top},left=${left},menubar=no,toolbar=no,location=no,status=no`
    );

    if (popup) {
      popup.document.write(`
        <html>
          <head><title>Loading BQool University...</title></head>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f9fafb;">
            <div style="text-align:center;">
              <div style="width:40px;height:40px;border:3px solid #e5e7eb;border-top:3px solid #4aaada;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
              <h3 style="color:#374151;margin:0;">Launching Course Player...</h3>
            </div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
          </body>
        </html>
      `);
    }

    try {
      // 2. Generate SSO URL pointing directly to this course
      const path = `/path-player?courseid=${course.id}`;
      const ssoUrl = await learnWorldClient.generateSSOUrl(
        user.email || '',
        user.uid,
        user.displayName || 'User',
        '',
        path
      );

      // 3. Redirect popup to SSO URL
      if (popup) {
        popup.location.href = ssoUrl;
      } else {
        window.open(ssoUrl, '_blank');
      }
    } catch (error) {
      console.error("Failed to launch course:", error);
      if (popup) {
        popup.document.body.innerHTML = `
          <div style="text-align:center;color:#ef4444;font-family:sans-serif;padding:20px;">
            <h3>Unable to launch course.</h3>
            <p>Please check your connection and try again.</p>
            <button onclick="window.close()" style="padding:8px 16px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;">Close</button>
          </div>
        `;
      }
    } finally {
      setLaunchingCourseId(null);
    }
  };

  // Fetch Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await learnWorldClient.getCourses();
        setCourses(data);
      } catch (err) {
        console.error('Error loading courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Courses to display: Only show "Getting Started" category and exclude specific IDs if needed
  const filteredCourses = courses.filter(c =>
    c.categories.includes('Getting Started') &&
    c.id !== 'ai-powered-bidding' // Example exclusion
  );

  // Logic: Automatically open wizard if user is NOT onboarded
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading) return;
      if (!user) {
        setCheckingStatus(false);
        return;
      }
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (!userData.onboarded) {
            setIsWizardOpen(true);
            setShouldRunTour(true);
          }
        } else {
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
            title: 'BQool University Courses',
            description: 'Explore our comprehensive video courses to master Amazon advertising strategies anytime.',
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
          onHighlightStarted: (element) => {
            if (!element) return;
            const event = new MouseEvent('mouseover', { 'view': window, 'bubbles': true, 'cancelable': true });
            element.dispatchEvent(event);
          },
          onDeselected: (element) => {
            if (!element) return;
            const event = new MouseEvent('mouseleave', { 'view': window, 'bubbles': true, 'cancelable': true });
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
    if (shouldRunTour) {
      setTimeout(() => { startTour(); }, 500);
    }
  };

  return (
    <DashboardShell>
      <div className="min-h-full bg-gray-50/50 p-8 font-sans">

        {/* Main Container */}
        <div className="max-w-6xl mx-auto">

          {/* Hero Section */}
          <div id="tour-welcome-hero" className="flex items-center justify-center text-center mb-10 pt-4">
            <div className="mr-6 relative">
              <div className="w-40 h-32 bg-blue-100 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
              <img
                src={StartHero.src}
                alt="Getting Started Illustration"
                className="w-64 h-auto relative z-10"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>

            <div className='flex flex-col items-center'>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Getting Started with BQool University
              </h1>

              <button
                onClick={startTour}
                className="mt-4 text-sm text-[#4aaada] hover:underline flex items-center gap-1"
              >
                <PlayCircleFill /> Replay Guide Tour
              </button>

              <div className="mt-6">
                <Button onClick={handleSSOLogin} variant="primary" disabled={ssoLoading || loadingCourses}>
                  {ssoLoading ? 'Redirecting...' : 'Visit BQool University (SSO)'}
                </Button>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div id="tour-feature-list">
            {loadingCourses ? (
              <div className="text-center py-20 text-gray-500">Loading BQool University courses...</div>
            ) : (
              <>

                {/* Course grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map(course => {
                    const isLaunching = launchingCourseId === course.id;
                    return (
                      <div
                        key={course.id}
                        className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group ${isLaunching ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
                        onClick={() => handleCourseClick(course)}
                      >
                        <div className="relative h-48 bg-gray-100 overflow-hidden">
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            {isLaunching ? (
                              <div className="w-10 h-10 border-4 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                              <PlayCircle size={48} className="text-white opacity-0 group-hover:opacity-90 transition-opacity drop-shadow-lg" />
                            )}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {course.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {course.duration}
                            </span>
                            <span>{course.lessons_count} Lessons</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
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
