'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Import the extracted components
import LoginForm from './LoginForm';
import WaitlistForm from './WaitlistForm';
import SignupForm from './SignupForm';

type AuthView = 'login' | 'signup';

// ==========================================
// MAIN PAGE CONTENT (State Manager)
// ==========================================
const AuthPageContent = () => {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen w-full flex bg-black text-white selection:bg-fuchsia-900 selection:text-white">

      {/* ... Left Column ... */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 py-12 relative z-10">

        {/* Logo */}
        <div className="absolute top-8 left-8 lg:left-12 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <Image
                src="/images/logo-icon.png"
                alt="Scriptoplay Logo"
                width={50}
                height={50}
                quality={100}
                priority
                className="h-8 w-auto object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Scriptoplay
            </span>
          </Link>
        </div>

        {/* Form Container Wrapper - Centered */}
        <div className="w-full max-w-md mx-auto mt-10 lg:mt-0">
          {view === 'signup' ? (
            <SignupForm
              onSwitchToLogin={() => setView('login')}
              isLoading={loading}
              setLoading={setLoading}
            />
          ) : (
            <LoginForm
              onSwitchToSignup={() => setView('signup')}
              isLoading={loading}
              setLoading={setLoading}
            />
          )}
        </div>

        {/* Footer Copyright */}
        <div className="absolute bottom-6 left-0 w-full text-center text-zinc-600 text-xs hidden lg:block">
          &copy; {new Date().getFullYear()} Scriptoplay. All rights reserved.
        </div>
      </div>

      {/* =========================================================
          RIGHT COLUMN: VISUALS & DASHBOARD PREVIEW
      ========================================================= */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-950 overflow-hidden items-center justify-center border-l border-zinc-900">

        {/* --- BACKGROUND IMAGE --- */}
        <div className="absolute inset-0 z-0">
          {/* 1. The Image */}
          <Image
            src="/images/auth-background.png" // Make sure this file exists!
            alt="Background Texture"
            fill
            className="object-cover" // Adjust opacity to blend
            priority
            quality={90}
          />

        </div>

        {/* Glassmorphism Dashboard Preview */}
        <div className="relative z-10 w-[85%] max-w-[800px] aspect-video bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-2 transform -rotate-2 hover:rotate-0 transition-all duration-700 ease-out group">
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">

            {/* Dashboard Image */}
            <div className="relative w-full h-full">
              <Image
                src="/images/dashboard-screenshot.png"
                alt="Dashboard Preview"
                fill
                className="object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Fallback if image fails to load */}
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 -z-10">
                <span className="text-zinc-700 text-xs font-mono">Loading Preview...</span>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default AuthPageContent;