'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowIcon } from "@/components/scriptoplay/icons";

import RevealAnimation from '@/components/scriptoplay/animation/RevealAnimation';
import { motion } from 'framer-motion';

// Content data derived from your design reference
const updatesData = [
  {
    id: 1,
    title: "Dashboard Redesigned with Bento Grid Layout",
    version: "v 2.0.1",
    date: "September 30, 2025",
    features: [
      "Reimagined the user dashboard with a modular bento grid layout replacing the traditional document list.",
      "Each module highlights key actions — such as Start New Script, View Insights, Recent Activity, and Shortcuts to Tools.",
      "Improves navigation, visual clarity, and task discovery for both new and returning users.",
      "Responsive layout optimized for desktop and tablet breakpoints."
    ],
    // Placeholders - replace with your real screenshots in public/images folder
    imageSrc: "/images/script-space.png", 
  },
  {
    id: 2,
    title: "Script Copilot Modes",
    version: "v 1.2.8",
    date: "Mar 15, 2025",
    features: [
      "Introduced genre-based writing assistance with Copilot Modes for Drama, Thriller, Comedy, and Sci-Fi.",
      "Each mode fine-tunes structure, tone, and pacing for your selected genre.",
      "Real-time suggestions dynamically adapt to scene type and character interaction.",
      "New sidebar toggle allows switching modes mid-draft."
    ],
    // Placeholders - replace with your real screenshots in public/images folder
    imageSrc: "/images/script-space.png", 
  },
  {
    id: 3,
    title: "User Dashboard Released",
    version: "v 1.2.7",
    date: "Jan 10, 2025",
    features: [
      "Launched personalized user dashboard for script creation and management.",
      "Includes script list view, recent activity, and quick-access to Generate and Evaluate tools.",
      "UI built with responsive design and loading optimizations.",
      "Added autosave drafts and script status indicators."
    ],
    imageSrc: "/images/dashboard-screenshot.png",
  },
  {
    id: 4,
    title: "User Admin Authentication",
    version: "v 1.2.5",
    date: "Nov 26, 2024",
    features: [
      "Implemented secure sign-up and login system with JWT-based authentication.",
      "Added role-based access control for admin and writer accounts.",
      "Backend user session management now supports email/password and OAuth login (Google).",
      "Admin panel added for user monitoring and script access control."
    ],
    imageSrc: "/images/sign-in.png",
  },
  {
    id: 5,
    title: "Landing page launched",
    version: "v 1.1.4",
    date: "Oct 15, 2024",
    features: [
      "Released the official Scriptoplay landing page with hero messaging, feature overview, FAQs, and contact section.",
      "Introduced navigation to Generate, Evaluate, About, FAQ, Updates, and Contact sections.",
      "Initial SEO, meta tags, and Open Graph tags configured for search and social visibility."
    ],
    imageSrc: "/images/landing-hero.png",
  }
];

const ChangeLogs = () => {
  return (
    <div className="relative bg-black w-full max-w-5xl mx-auto px-6">
      
      {/* Background Decorative Gradient */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-fuchsia-900/20 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header Section */}
      <div className="relative z-10 text-center mb-24 space-y-6">
        {/* Badge */}
        <RevealAnimation delay={0.1} direction="down" duration={1.2} offset={60}>
            <span className="inline-block px-4 py-2 rounded-xl border border-[#a22070]/50 bg-gray-950 text-gray-400 text-sm font-medium mb-4 tracking-wider">
                Updates & Changelog
            </span>
        </RevealAnimation>
        <RevealAnimation delay={0.2} direction="down" duration={1.2} offset={60}>
            <h1 className="text-5xl md:text-6xl text-white font-bold mb-4">What's New</h1>
        </RevealAnimation>
        <RevealAnimation delay={0.3} direction="down" duration={1.2} offset={60}>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-16">
                We’re building Scriptoplay in the open. Track our latest improvements, new features, and fixes that help you write smarter and faster.
            </p>
        </RevealAnimation>
      </div>

      {/* Timeline/Cards List */}
        <div className="relative z-10 flex flex-col gap-20">
          {updatesData.map((update) => (
            
            // 2. Change div to motion.div
          <motion.div 
            key={update.id} 
            
            // 3. Define the START state (Invisible, slightly down)
            initial={{ opacity: 0, y: 50 }}

            // 4. Define the TRIGGER (When it enters the viewport)
            whileInView={{ opacity: 1, y: 0 }}

            // 5. CONFIGURATION
            // once: true -> Animation only happens once (doesn't hide again when scrolling up)
            // margin: "-100px" -> Triggers when the element is 100px inside the screen (prevents triggering too early)
            viewport={{ once: true, margin: "-100px" }}

            // 6. Smooth transition
            transition={{ duration: 0.5, ease: "easeOut" }}

            className="group relative bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 transition-colors duration-300 rounded-3xl overflow-hidden p-8 md:p-10"
          >
            <div 
              key={update.id} 
              className="group relative bg-zinc-800/30 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 rounded-3xl overflow-hidden p-8 md:p-10"
            >
              <div className="flex flex-col gap-8">
                
                {/* Text Content */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-medium text-white/90 mb-2">
                    {update.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm md:text-md test-white/80 mb-6">
                      <span className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded border border-zinc-700">
                        {update.version}
                      </span>
                      <span className="text-zinc-500">
                        {update.date}
                      </span>
                    </div>
                  
                  <ul className="space-y-3 mb-6">
                    {update.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-zinc-400 text-sm md:text-lg leading-relaxed">
                        <span className="mr-3 mt-2 block w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0 group-hover:bg-zinc-500 transition-colors" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Card Meta Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <Link 
                      href="#" 
                      className="flex items-center text-md font-medium text-white hover:text-fuchsia-400 transition-colors group/link"
                    >
                      Read more 
                      <ArrowIcon className="w-4 h-4 ml-1 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                    
                    
                  </div>
                </div>

                {/* Image Preview Area */}
                <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl">
                  {/* 
                    Fallback if image is missing: A dark box. 
                    Ensure Next/Image is used for production 
                  */}
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                    {/* IMAGES */}
                    <Image src={update.imageSrc} alt={update.title} fill className="object-cover" /> */
                    
                    {/* Placeholder Text */}
                    <span className="text-zinc-700 text-sm">Image Reference: {update.title}</span>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>

            
          ))}
        </div>
      
      
    </div>
  );
};

export default ChangeLogs;