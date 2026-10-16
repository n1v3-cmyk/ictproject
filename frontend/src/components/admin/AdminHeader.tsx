'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, ShieldCheck, UserCheck, ArrowLeft, Filter, Sparkles } from 'lucide-react';
import { useFeedback } from '@/context/FeedbackContext';

interface AdminHeaderProps {
  onOpenMobileMenu: () => void;
  title?: string;
}

export function AdminHeader({ onOpenMobileMenu, title = 'Administrative Intelligence Suite' }: AdminHeaderProps) {
  const { filteredFeedbacks, feedbacks, filters } = useFeedback();

  // Count active filters
  const activeFiltersCount = [
    filters.district !== 'all',
    filters.departmentId !== 'all',
    filters.serviceId !== 'all',
    filters.sentiment !== 'all',
    filters.rating !== 'all',
    filters.dateRange !== 'all',
    Boolean(filters.searchQuery.trim()),
  ].filter(Boolean).length;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E5E9E6] h-16 flex items-center px-4 sm:px-6 lg:px-8 justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 lg:hidden"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-semibold text-stone-900 leading-tight">
            {title}
          </h1>
          <p className="text-xs text-stone-500 hidden sm:block">
            Government of Kerala • Departmental Service Quality Monitoring
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Active Filter Indicator Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2F7F4] border border-[#CADACF] text-xs text-[#2C4032]">
          <Filter className="w-3.5 h-3.5 text-[#46664F]" />
          <span>
            {activeFiltersCount > 0
              ? `${activeFiltersCount} Filter${activeFiltersCount > 1 ? 's' : ''} Active`
              : 'All Data Active'}
          </span>
          <span className="text-stone-400 font-mono text-[11px] ml-1">
            ({filteredFeedbacks.length} / {feedbacks.length})
          </span>
        </div>

        {/* Nodal Officer Badge */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-stone-200">
          <div className="w-8 h-8 rounded-full bg-[#EBF2ED] text-[#46664F] flex items-center justify-center font-bold text-xs border border-[#CADACF]">
            DA
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-stone-900 leading-tight">Demo Officer</p>
            <p className="text-[10px] text-stone-500">State Secretariat</p>
          </div>
        </div>

        {/* Switch to Citizen View */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
          title="Return to Citizen Portal"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Citizen Portal</span>
        </Link>
      </div>
    </header>
  );
}
