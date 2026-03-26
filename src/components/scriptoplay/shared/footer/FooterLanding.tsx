"use client";

import Link from 'next/link';
import Image from "next/image";

const FooterLanding = () => {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-8 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Brand Info */}
          <div className="md:col-span-2">
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
            <p className="text-gray-400 text-sm mt-5 leading-relaxed max-w-xs">
              Your trusted partner in AI solutions, creating smarter systems for smarter businesses.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h6 className="text-white/60 font-bold mb-6">Navigation</h6>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="#generation" className="hover:text-white transition-colors">Generation</Link></li>
              <li><Link href="#evaluation" className="hover:text-white transition-colors">Evaluation</Link></li>
              <li><Link href="#about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="#faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="#contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Column 3: Quick Access */}
          <div>
            <h6 className="text-white/60 font-bold mb-6">Quick Access</h6>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/scriptoplay/login" className="hover:text-white transition-colors">Sign Up</Link></li>
              <li><Link href="/scriptoplay/updates" className="hover:text-white transition-colors">Updates</Link></li>
            </ul>
          </div>
        </div>

        <div className="w">
          <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center text-xs">
            <p className='text-white/60'>@2025 Scriptoplay</p>
            <p className='text-white/60 pr-50'>© All rights reserved</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterLanding;
