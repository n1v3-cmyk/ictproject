'use client';

import React from 'react';
import { Filter, Search, RotateCcw, X } from 'lucide-react';
import { useFeedback } from '@/context/FeedbackContext';
import { KERALA_DISTRICTS } from '@/data/keralaData';

interface FilterBarProps {
  showSearch?: boolean;
  className?: string;
}

export function FilterBar({ showSearch = true, className = '' }: FilterBarProps) {
  const { filters, setFilter, resetFilters, departments, feedbacks, filteredFeedbacks } = useFeedback();

  // Services available for current department
  const selectedDept = departments.find((d) => d.id === filters.departmentId);
  const availableServices = selectedDept ? selectedDept.services : [];

  const hasActiveFilters =
    filters.district !== 'all' ||
    filters.departmentId !== 'all' ||
    filters.serviceId !== 'all' ||
    filters.sentiment !== 'all' ||
    filters.rating !== 'all' ||
    filters.dateRange !== 'all' ||
    Boolean(filters.searchQuery.trim());

  return (
    <div className={`bg-white rounded-2xl border border-[#E5E9E6] p-4 sm:p-5 shadow-xs space-y-3.5 ${className}`}>
      {/* Top Filter Bar Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EBF2ED] text-[#46664F] flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
            Analysis Filters
          </span>
          <span className="text-xs text-stone-500 font-mono">
            (Showing {filteredFeedbacks.length} of {feedbacks.length} records)
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="self-start lg:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors border border-stone-200"
          >
            <RotateCcw className="w-3 h-3 text-stone-400" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
        {/* District Filter */}
        <div>
          <label htmlFor="filter-district" className="block text-[11px] font-medium text-stone-500 mb-1">
            District
          </label>
          <select
            id="filter-district"
            value={filters.district}
            onChange={(e) => setFilter('district', e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-2.5 py-2 text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#46664F]"
          >
            <option value="all">All 14 Districts</option>
            {Object.keys(KERALA_DISTRICTS).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label htmlFor="filter-department" className="block text-[11px] font-medium text-stone-500 mb-1">
            Department
          </label>
          <select
            id="filter-department"
            value={filters.departmentId}
            onChange={(e) => setFilter('departmentId', e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-2.5 py-2 text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#46664F]"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Specific Service Filter */}
        <div>
          <label htmlFor="filter-service" className="block text-[11px] font-medium text-stone-500 mb-1">
            Service
          </label>
          <select
            id="filter-service"
            disabled={filters.departmentId === 'all'}
            value={filters.serviceId}
            onChange={(e) => setFilter('serviceId', e.target.value)}
            className={`w-full rounded-xl border border-stone-200 px-2.5 py-2 text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#46664F] ${
              filters.departmentId === 'all' ? 'bg-stone-50 text-stone-400 cursor-not-allowed' : ''
            }`}
          >
            <option value="all">
              {filters.departmentId === 'all' ? 'Select department first' : 'All Department Services'}
            </option>
            {availableServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sentiment Filter */}
        <div>
          <label htmlFor="filter-sentiment" className="block text-[11px] font-medium text-stone-500 mb-1">
            Sentiment
          </label>
          <select
            id="filter-sentiment"
            value={filters.sentiment}
            onChange={(e) => setFilter('sentiment', e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-2.5 py-2 text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#46664F]"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive (Constructive)</option>
            <option value="neutral">Neutral (Mixed/Steady)</option>
            <option value="negative">Negative (Bottlenecks)</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <label htmlFor="filter-rating" className="block text-[11px] font-medium text-stone-500 mb-1">
            Overall Rating
          </label>
          <select
            id="filter-rating"
            value={filters.rating}
            onChange={(e) => setFilter('rating', e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-2.5 py-2 text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#46664F]"
          >
            <option value="all">All Ratings (1 - 5)</option>
            <option value="5">5 Stars (Excellent)</option>
            <option value="4">4 Stars (Good)</option>
            <option value="3">3 Stars (Acceptable)</option>
            <option value="2">2 Stars (Needs Improvement)</option>
            <option value="1">1 Star (Poor)</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label htmlFor="filter-date-range" className="block text-[11px] font-medium text-stone-500 mb-1">
            Date Window
          </label>
          <select
            id="filter-date-range"
            value={filters.dateRange}
            onChange={(e) => setFilter('dateRange', e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-2.5 py-2 text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-[#46664F]"
          >
            <option value="all">All Available Records</option>
            <option value="7days">Past 7 Days</option>
            <option value="30days">Past 30 Days</option>
            <option value="90days">Past 90 Days</option>
          </select>
        </div>
      </div>

      {/* Keyword Search Bar (Optional depending on page) */}
      {showSearch && (
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search keywords, reference IDs, services, or locations (e.g. 'delay', 'CC-KL-2026-1011', 'license', 'Ernakulam')..."
            value={filters.searchQuery}
            onChange={(e) => setFilter('searchQuery', e.target.value)}
            className="w-full rounded-xl border border-stone-200 pl-10 pr-9 py-2 text-xs text-stone-900 bg-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#46664F]"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => setFilter('searchQuery', '')}
              className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
              aria-label="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
