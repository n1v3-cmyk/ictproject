'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock } from 'lucide-react';
import { API_MODE } from '@/lib/config';

export function CitizenFooter() {
  return (
    <footer className="bg-white border-t border-line mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sage-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg text-stone-900">CivicConnect</span>
            </div>
            <p className="text-sm text-stone-600 max-w-md leading-relaxed">
              CivicConnect is a modern citizen feedback and government service analysis platform. By collecting and systematically analyzing real citizen experiences across Kerala departments, we empower public administration to identify structural bottlenecks and enhance delivery standards.
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-500 bg-canvas p-3 rounded-xl border border-stone-200/80 max-w-md">
              <Lock className="w-4 h-4 text-sage-600 shrink-0" />
              <span>
                {API_MODE === 'mock'
                  ? 'Demonstration mode: submissions are stored in this browser for review simulation. No personal data leaves your device.'
                  : 'Submissions are transmitted securely to the government service-analysis backend. No personal data is shared publicly.'}
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-sm text-stone-600">
              <li>
                <Link href="/" className="hover:text-sage-600 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/feedback" className="hover:text-sage-600 transition-colors">Submit Service Feedback</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-sage-600 transition-colors">About CivicConnect</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-sage-600 transition-colors">Privacy & Data Handling</Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-sage-600 transition-colors">Administrative Analytics Suite</Link>
              </li>
            </ul>
          </div>

          {/* Core Principles */}
          <div>
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-3">Feedback Principles</h4>
            <ul className="space-y-2 text-xs text-stone-600">
              <li className="flex items-start gap-1.5">
                <span className="text-sage-600 font-bold">•</span>
                <span>Systemic service analysis, not individual grievance tracking</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sage-600 font-bold">•</span>
                <span>Anonymous submission option protects citizen identity</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-sage-600 font-bold">•</span>
                <span>OpenStreetMap & transparent aggregate sentiment metrics</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© 2026 CivicConnect Platform • Department of Administrative Reforms Simulation</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-stone-800">Privacy Policy</Link>
            <Link href="/about" className="hover:text-stone-800">Terms of Use</Link>
            <Link href="/admin/login" className="hover:text-stone-800">Official Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
