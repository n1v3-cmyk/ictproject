'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { useFeedback } from '@/context/FeedbackContext';
import { FilterBar } from '@/components/admin/FilterBar';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

// Dynamically load Leaflet map on client-side only
const GeographicMap = dynamic(() => import('@/components/admin/GeographicMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] bg-stone-100 rounded-2xl flex flex-col items-center justify-center text-stone-500 gap-3 border border-stone-200">
      <div className="w-8 h-8 border-3 border-[#46664F] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-medium">Initializing Kerala Geographic Cartography...</span>
    </div>
  ),
});

export default function GeographicAnalysisPage() {
  const { filteredFeedbacks, feedbacks, filters, setFilter } = useFeedback();

  // Calculate problem hotspots vs high satisfaction clusters
  const districtCounts: Record<string, { total: number; negative: number; positive: number }> = {};
  filteredFeedbacks.forEach((f) => {
    const d = f.location.district;
    if (!districtCounts[d]) districtCounts[d] = { total: 0, negative: 0, positive: 0 };
    districtCounts[d].total += 1;
    if (f.sentiment === 'negative') districtCounts[d].negative += 1;
    if (f.sentiment === 'positive') districtCounts[d].positive += 1;
  });

  const highIssueDistricts = Object.entries(districtCounts)
    .filter(([_, data]) => data.negative >= 2)
    .sort((a, b) => b[1].negative - a[1].negative);

  return (
    <div className="space-y-6">
      {/* Dynamic Global Filter Bar */}
      <FilterBar />

      {/* Demonstration Notice Alert */}
      <div className="p-4 rounded-2xl bg-[#FEF8EB] border border-[#FDE68A] flex items-start gap-3 text-xs text-[#92400E]">
        <Info className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Demonstration Geospatial Visualization Notice</p>
          <p className="leading-relaxed">
            Geographic pins represent aggregated mock feedback samples across Kerala districts to demonstrate spatial analysis capabilities. They do not represent real-time emergency incidents or confirmed departmental violations. Device GPS locations are never polled automatically.
          </p>
        </div>
      </div>

      {/* Main Map Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Container */}
        <Card className="lg:col-span-8 overflow-hidden flex flex-col">
          <CardHeader className="py-4 px-6 flex items-center justify-between border-b border-stone-100 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EBF2ED] text-[#46664F] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  Kerala Service Feedback Map
                </h3>
                <p className="text-xs text-stone-500">
                  OpenStreetMap tile layer • Color-coded average rating pins
                </p>
              </div>
            </div>

            <div className="text-xs text-stone-500 font-mono">
              Plotting {filteredFeedbacks.length} submissions
            </div>
          </CardHeader>

          <CardContent className="p-4 flex-1 min-h-[520px]">
            <GeographicMap
              feedbacks={filteredFeedbacks}
              selectedDistrict={filters.district}
            />
          </CardContent>

          {/* Map Legend Footer */}
          <div className="p-4 bg-[#FBFBF9] border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-600">
            <div className="flex items-center gap-6">
              <span className="font-semibold text-stone-700">Map Legend:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#EF4444] border-2 border-white shadow-2xs" />
                <span>Frequent Issues (Rating &lt; 2.8)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#F59E0B] border-2 border-white shadow-2xs" />
                <span>Mixed / Moderate (2.8 - 3.7)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#22C55E] border-2 border-white shadow-2xs" />
                <span>High Satisfaction (≥ 3.8)</span>
              </span>
            </div>

            <span className="text-[11px] text-stone-400">
              Click any circle pin to inspect localized metrics
            </span>
          </div>
        </Card>

        {/* Geospatial Hotspots Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Identified Bottleneck Clusters */}
          <Card>
            <CardHeader className="py-4 px-5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-stone-900">
                Service Friction Hotspots
              </h3>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {highIssueDistricts.length === 0 ? (
                <p className="text-xs text-stone-500 py-4 text-center">
                  No districts currently exhibit recurring negative clusters under selected filters.
                </p>
              ) : (
                highIssueDistricts.map(([districtName, data]) => {
                  const negPercent = Math.round((data.negative / data.total) * 100);
                  return (
                    <div
                      key={districtName}
                      onClick={() => setFilter('district', districtName)}
                      className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-[#CADACF] hover:bg-stone-50 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-stone-900">
                          {districtName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                          {data.negative} Critical Alerts
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>Total reviews: {data.total}</span>
                        <span className="text-red-600 font-medium">{negPercent}% Negative</span>
                      </div>

                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-red-500 h-full"
                          style={{ width: `${negPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* District Quick Zoom Selector */}
          <Card>
            <CardHeader className="py-4 px-5 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#46664F]" />
              <h3 className="text-sm font-semibold text-stone-900">
                District Focus Navigator
              </h3>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              <p className="text-xs text-stone-500 mb-3">
                Select a district to fly the camera directly to its geographical administrative center:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['Thiruvananthapuram', 'Ernakulam', 'Kozhikode', 'Thrissur', 'Palakkad', 'Kollam', 'Kannur', 'Kottayam', 'Malappuram'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFilter('district', d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      filters.district === d
                        ? 'bg-[#46664F] text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
