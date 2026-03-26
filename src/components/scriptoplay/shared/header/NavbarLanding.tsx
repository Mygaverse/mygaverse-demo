"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from "next/image";
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';

const NavbarLanding = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = [
    { label: "Generation", href: "/#generation" },
    { label: "Evaluation", href: "/#evaluation" },
    { label: "About",      href: "/#about" },
    { label: "FAQ",        href: "/#faq" },
    { label: "Updates",    href: "/scriptoplay/updates" },
  ];

  return (
    <header className="fixed top-6 left-0 right-0 z-50 w-full px-4">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between rounded-2xl border border-white/10 bg-black/50 px-6 shadow-sm backdrop-blur-md transition-all">

        {/* LEFT: Logo & Brand Name */}
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

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-md font-medium text-white hover:text-gray-400 transition-colors tracking-wide"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Action Button */}
        <div className="hidden md:block">
          <Link href="/scriptoplay/login" className="text-white text-sm px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 shadow-2xl bg-gradient-to-r from-[#DD136A] to-[#482C5C]">
            Get Started
            <Icon icon={ICONS.arrowRight} size={20} className='text-white group-hover:translate-x-1 transition-transform' />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-white">
            {isOpen ? (
              <Icon icon={ICONS.close} size={28} />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-black border-b border-white/10 p-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block text-gray-300 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default NavbarLanding;
