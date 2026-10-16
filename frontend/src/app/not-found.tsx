'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Home, LayoutDashboard } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blush-50 border border-blush-200 text-blush-ink flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-stone-400 font-mono">
            Error 404 • Page Not Located
          </span>
          <h1 className="text-3xl font-semibold text-stone-900">
            Document or Jurisdiction Not Found
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            The civic page or service record you requested is unavailable or has been archived.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-sage-600 text-white hover:bg-sage-700 transition-colors shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>

          <Link
            href="/admin/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Admin Suite</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
