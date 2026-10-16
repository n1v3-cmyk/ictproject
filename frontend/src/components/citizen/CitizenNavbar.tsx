'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, MessageSquarePlus, Info, Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useFeedback } from '@/context/FeedbackContext';

export function CitizenNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdminLoggedIn } = useFeedback();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Share Feedback', href: '/feedback' },
    { name: 'About & Privacy', href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FBFBF9]/90 backdrop-blur-md border-b border-[#E5E9E6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#46664F] text-white flex items-center justify-center shadow-xs group-hover:bg-[#38523F] transition-colors">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg text-stone-900 tracking-tight">CivicConnect</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#EBF2ED] text-[#38523F]">
                  Kerala
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">Public Service Improvement Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#EBF2ED] text-[#2C4032]'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/feedback"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#46664F] text-white hover:bg-[#38523F] shadow-xs hover:shadow-sm transition-all"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Share Feedback</span>
            </Link>

            <div className="h-6 w-px bg-stone-200" />

            <Link
              href={isAdminLoggedIn ? '/admin/dashboard' : '/admin/login'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors border border-stone-200"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-stone-500" />
              <span>{isAdminLoggedIn ? 'Admin Portal' : 'Admin Login'}</span>
              <ArrowRight className="w-3 h-3 text-stone-400" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/feedback"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#46664F] text-white"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Feedback</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-[#FBFBF9] px-4 pt-2 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-base font-medium ${
                  pathname === link.href ? 'bg-[#EBF2ED] text-[#2C4032]' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
            <Link
              href={isAdminLoggedIn ? '/admin/dashboard' : '/admin/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-stone-700 bg-stone-100/70 border border-stone-200"
            >
              <span className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-stone-500" />
                {isAdminLoggedIn ? 'Go to Admin Portal' : 'Admin Login (Department Officers)'}
              </span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
