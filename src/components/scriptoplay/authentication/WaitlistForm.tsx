'use client';

import React, { useState } from 'react';
import Link from 'next/link';
//import { ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

// 1. New Icon Logic Imports
import Icon from '@/components/scriptoplay/ui/Icon';
import { ICONS } from '@/config/scriptoplay/icons';
import { createClient } from '@/lib/scriptoplay/supabase/client';

interface WaitlistFormProps {
  onBack: () => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function WaitlistForm({ onBack, isLoading, setLoading }: WaitlistFormProps) {
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    purpose: '',
    message: ''
  });
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('waitlist_requests')
        .insert({
          name: form.name,
          email: form.email,
          company: form.company,
          role: form.role,
          purpose: form.purpose,
          message: form.message,
          status: 'pending'
        });

      if (error) throw error;

      setSuccess(true);
    } catch (error) {
      console.error("Waitlist error", error);
      alert("Something went wrong submitting your request.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (success) {
    return (
      <div className="text-center animate-in zoom-in duration-300 py-10 w-full">
        <div className="mx-auto w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-6">
          <Icon icon={ICONS.checkCircle} size={10} className='text-green-500' />

        </div>
        <h2 className="text-3xl font-bold text-white mb-4">You're on the list!</h2>
        <p className="text-zinc-400 mb-8 max-w-xs mx-auto">
          Something amazing is coming. We've sent a confirmation email to <span className="text-white font-medium">{form.email}</span>.
        </p>
        <Link
          href="/"
          className="cursor-pointer text-fuchsia-500 hover:text-fuchsia-400 flex items-center justify-center gap-2 mx-auto transition-colors"
        >
          Back to Home <Icon icon={ICONS.arrowRight} size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 w-full">
      <div className="mb-6">
        <div className="inline-block px-4 py-2 rounded-xl border border-[#a22070]/50 bg-gray-950 text-fuchsia-400 text-sm font-medium mb-4 tracking-wider">
          Launching Soon!
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Sign up for Waitlist!</h1>
        <p className="text-zinc-400 text-md leading-relaxed">
          Something amazing is coming your way soon. Enter your details below to join our early-access list.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Name & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-zinc-300 text-xs font-medium uppercase tracking-wide">Name *</label>
            <input name="name" required className="w-full bg-zinc-900 border border-zinc-700 focus:border-fuchsia-600 rounded-lg px-3 py-2.5 text-white outline-none text-sm placeholder:text-zinc-600 transition-colors" placeholder="David Johnson" value={form.name} onChange={handleChange} />
          </div>
          <div className="space-y-1.5">
            <label className="text-zinc-300 text-xs font-medium uppercase tracking-wide">Email *</label>
            <input name="email" type="email" required className="w-full bg-zinc-900 border border-zinc-700 focus:border-fuchsia-600 rounded-lg px-3 py-2.5 text-white outline-none text-sm placeholder:text-zinc-600 transition-colors" placeholder="example@mail.com" value={form.email} onChange={handleChange} />
          </div>
        </div>

        {/* Row 2: Company */}
        <div className="space-y-1.5">
          <label className="text-zinc-300 text-xs font-medium uppercase tracking-wide">Company Name *</label>
          <input name="company" required className="w-full bg-zinc-900 border border-zinc-700 focus:border-fuchsia-600 rounded-lg px-3 py-2.5 text-white outline-none text-sm placeholder:text-zinc-600 transition-colors" placeholder="Scriptoplay" value={form.company} onChange={handleChange} />
        </div>

        {/* Row 3: Role & Purpose */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-zinc-300 text-xs font-medium uppercase tracking-wide">Select Role *</label>
            <div className='relative'>
              <select name="role" required
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-fuchsia-600 rounded-lg px-3 py-2.5 text-white outline-none text-sm appearance-none transition-colors"
                value={form.role} onChange={handleChange}
              >
                <option value="" disabled>Select Your Roles</option>
                <option value="writer">Screenwriter</option>
                <option value="director">Director</option>
                <option value="producer">Producer</option>
                <option value="investor">Investor</option>
                <option value="distributor">Distributor</option>
                <option value="other">Other</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-300 text-xs font-medium uppercase tracking-wide">Purpose *</label>
            <div className="relative">
              <select name="purpose" required
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-fuchsia-600 rounded-lg px-3 py-2.5 text-white outline-none text-sm appearance-none transition-colors"
                value={form.purpose} onChange={handleChange}
              >
                <option value="" disabled>Select Your Purpose</option>
                <option value="scriptwriting">Testing Scriptwriting</option>
                <option value="evaluation">Testing Script Evaluation</option>
                <option value="education">Looking for Production Collaboration</option>
                <option value="investing">Investing Scripts</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Message */}
        <div className="space-y-1.5">
          <label className="text-zinc-300 text-xs font-medium uppercase tracking-wide">Messages</label>
          <textarea
            name="message" rows={3}
            className="w-full bg-zinc-900 border border-zinc-700 focus:border-fuchsia-600 rounded-lg px-3 py-2.5 text-white outline-none text-sm placeholder:text-zinc-600 transition-colors resize-none"
            placeholder="Tell us more about your project"
            value={form.message} onChange={handleChange}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer disabled:cursor-not-allowed w-full sm:w-auto px-8 bg-[#C22883] hover:bg-[#a0206b] text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-fuchsia-900/20 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? <Icon icon={ICONS.spinner} size={4} className="animate-spin w-4 h-4" /> : (
              <>Sign up now <Icon icon={ICONS.arrowRight} size={18} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Footer / Back Link */}
      <div className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-6">
        <button onClick={onBack} className="cursor-pointer text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
          &larr; Back to login
        </button>
        <span className="text-sm text-zinc-600">
          We will contact you within 24 business hours.
        </span>
      </div>
    </div>
  );
}