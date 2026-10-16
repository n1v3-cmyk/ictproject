'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Download,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useFeedback } from '@/context/FeedbackContext';
import { FilterBar } from '@/components/admin/FilterBar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, BadgeVariant } from '@/components/ui/Badge';

export default function ReportsInsightsPage() {
  const { filteredFeedbacks, departments } = useFeedback();

  // Active analysis tab
  const [activeTab, setActiveTab] = useState<'dimensions' | 'districts' | 'trends' | 'keywords'>('dimensions');

  // Department Multi-dimensional Radar/Bar Data
  const departmentDimensionData = useMemo(() => {
    return departments.map((dept) => {
      const records = filteredFeedbacks.filter((f) => f.departmentId === dept.id);
      const count = records.length;
      if (count === 0) {
        return {
          code: dept.code,
          name: dept.name,
          count: 0,
          helpfulness: 0,
          communication: 0,
          professionalism: 0,
          responseTime: 0,
          overall: 0,
        };
      }

      const sum = records.reduce(
        (acc, r) => ({
          h: acc.h + r.categoryRatings.helpfulness,
          c: acc.c + r.categoryRatings.communication,
          p: acc.p + r.categoryRatings.professionalism,
          rt: acc.rt + r.categoryRatings.responseTime,
          ov: acc.ov + r.overallRating,
        }),
        { h: 0, c: 0, p: 0, rt: 0, ov: 0 }
      );

      return {
        code: dept.code,
        name: dept.name,
        count,
        helpfulness: Number((sum.h / count).toFixed(2)),
        communication: Number((sum.c / count).toFixed(2)),
        professionalism: Number((sum.p / count).toFixed(2)),
        responseTime: Number((sum.rt / count).toFixed(2)),
        overall: Number((sum.ov / count).toFixed(2)),
      };
    }).filter((d) => d.count > 0);
  }, [departments, filteredFeedbacks]);

  // District-wise Performance Breakdown
  const districtPerformanceData = useMemo(() => {
    const map: Record<
      string,
      { district: string; count: number; avgRating: number; positiveCount: number; negativeCount: number }
    > = {};

    filteredFeedbacks.forEach((f) => {
      const d = f.location.district;
      if (!map[d]) {
        map[d] = { district: d, count: 0, avgRating: 0, positiveCount: 0, negativeCount: 0 };
      }
      map[d].count += 1;
      map[d].avgRating += f.overallRating;
      if (f.sentiment === 'positive') map[d].positiveCount += 1;
      if (f.sentiment === 'negative') map[d].negativeCount += 1;
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        avgRating: Number((item.avgRating / item.count).toFixed(2)),
        positiveRate: Math.round((item.positiveCount / item.count) * 100),
        negativeRate: Math.round((item.negativeCount / item.count) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredFeedbacks]);

  // Sentiment & Volume Weekly Trend Lines
  const weeklyTrendData = useMemo(() => {
    const dates: Record<string, { date: string; positive: number; negative: number; neutral: number; avg: number; count: number }> = {};

    filteredFeedbacks.forEach((f) => {
      const d = new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dates[d]) {
        dates[d] = { date: d, positive: 0, negative: 0, neutral: 0, avg: 0, count: 0 };
      }
      if (f.sentiment === 'positive') dates[d].positive += 1;
      if (f.sentiment === 'negative') dates[d].negative += 1;
      if (f.sentiment === 'neutral') dates[d].neutral += 1;
      dates[d].avg += f.overallRating;
      dates[d].count += 1;
    });

    return Object.values(dates).map((item) => ({
      ...item,
      avg: Number((item.avg / item.count).toFixed(2)),
    }));
  }, [filteredFeedbacks]);

  // Keyword Frequency Ranking
  const keywordRanking = useMemo(() => {
    const freqs: Record<string, { keyword: string; count: number; type: 'negative' | 'positive' }> = {};

    filteredFeedbacks.forEach((f) => {
      f.keywords.forEach((kw) => {
        if (!freqs[kw]) {
          freqs[kw] = { keyword: kw, count: 0, type: f.sentiment === 'negative' ? 'negative' : 'positive' };
        }
        freqs[kw].count += 1;
      });
    });

    return Object.values(freqs).sort((a, b) => b.count - a.count);
  }, [filteredFeedbacks]);

  // Export Complete Report as CSV
  const handleExportReportCSV = () => {
    if (districtPerformanceData.length === 0) return;

    const headers = ['District', 'Total Feedback', 'Average Rating', 'Positive %', 'Negative %'];
    const rows = districtPerformanceData.map((d) => [
      `"${d.district}"`,
      d.count,
      d.avgRating,
      `${d.positiveRate}%`,
      `${d.negativeRate}%`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CivicConnect_Executive_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Global Filter Bar */}
      <FilterBar />

      {/* Strategic Header & CSV Download */}
      <div className="bg-white rounded-2xl border border-line p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sage-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-sage-600" />
            <span>Administrative Intelligence Briefing</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900">
            Systemic Performance & Trend Evaluation
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Synthesized across {filteredFeedbacks.length} feedback records in {districtPerformanceData.length} active districts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportReportCSV}
          disabled={districtPerformanceData.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-sage-600 text-white hover:bg-sage-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>Export Summary Report (CSV)</span>
        </button>
      </div>

      {/* Automated Key Insights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-pos-surface border border-pos-border space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-pos-ink">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Top Performing Channel</span>
          </div>
          <p className="text-xs text-stone-700 leading-relaxed">
            Revenue & Land Records and Local Self Government digital certificates report highest satisfaction (averaging 4.6/5.0).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-warn-surface border border-warn-border space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-warn-ink">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>Turnaround Gap Identified</span>
          </div>
          <p className="text-xs text-stone-700 leading-relaxed">
            Physical counter transactions report 2.1x more response-time concerns than online Akshaya portal submissions.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neg-surface border border-neg-border space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-neg-ink">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Priority Attention Sector</span>
          </div>
          <p className="text-xs text-stone-700 leading-relaxed">
            Motor Vehicles (MVD) slot booking and KWA pipeline repair response exhibit recurring bottleneck keywords (&apos;delay&apos;, &apos;waiting&apos;).
          </p>
        </div>
      </div>

      {/* Analysis Tabs */}
      <div className="border-b border-stone-200 flex items-center gap-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('dimensions')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'dimensions'
              ? 'border-sage-600 text-sage-600 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Department Dimension Breakdown
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('districts')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'districts'
              ? 'border-sage-600 text-sage-600 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          District Performance Table
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trends')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'trends'
              ? 'border-sage-600 text-sage-600 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Sentiment & Rating Trends
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('keywords')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'keywords'
              ? 'border-sage-600 text-sage-600 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Keyword & Issue Ranking
        </button>
      </div>

      {/* Tab 1: Department Dimensions */}
      {activeTab === 'dimensions' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                Evaluation Across 4 Service Quality Dimensions
              </h3>
              <p className="text-xs text-stone-500">
                Comparing Helpfulness, Communication, Professionalism, and Response Time
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-sage-600" /> Overall</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-sage-500" /> Helpfulness</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-xs bg-sage-350" /> Speed</span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentDimensionData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F0" />
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#6E7571' }} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#6E7571' }} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                <Bar dataKey="overall" name="Overall Rating" fill="#46664F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="helpfulness" name="Staff Helpfulness" fill="#5B8266" radius={[4, 4, 0, 0]} />
                <Bar dataKey="responseTime" name="Response Speed" fill="#88A891" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Dimensions Matrix */}
          <div className="overflow-x-auto pt-4 border-t border-stone-100">
            <table className="w-full text-left text-xs">
              <thead className="text-stone-500 uppercase tracking-wider font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-3">Reviews</th>
                  <th className="py-2 px-3">Overall</th>
                  <th className="py-2 px-3">Helpfulness</th>
                  <th className="py-2 px-3">Communication</th>
                  <th className="py-2 px-3">Professionalism</th>
                  <th className="py-2 px-3">Response Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {departmentDimensionData.map((d) => (
                  <tr key={d.code} className="hover:bg-stone-50">
                    <td className="py-2.5 px-3 font-medium text-stone-900">{d.name} ({d.code})</td>
                    <td className="py-2.5 px-3 font-mono">{d.count}</td>
                    <td className="py-2.5 px-3 font-bold text-stone-900">★ {d.overall}</td>
                    <td className="py-2.5 px-3">{d.helpfulness}</td>
                    <td className="py-2.5 px-3">{d.communication}</td>
                    <td className="py-2.5 px-3">{d.professionalism}</td>
                    <td className="py-2.5 px-3 font-semibold text-stone-800">{d.responseTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: District Table */}
      {activeTab === 'districts' && (
        <Card className="overflow-hidden">
          <CardHeader className="py-4 px-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">District Performance Ranking</h3>
              <p className="text-xs text-stone-500">Service satisfaction aggregates across Kerala districts</p>
            </div>
            <span className="text-xs text-stone-400 font-mono">
              {districtPerformanceData.length} Districts Analyzed
            </span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-blush-50/40 border-y border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">District</th>
                  <th className="py-3 px-4">Submissions</th>
                  <th className="py-3 px-4">Average Rating</th>
                  <th className="py-3 px-4">Constructive / Pos. Rate</th>
                  <th className="py-3 px-4">Bottleneck / Neg. Rate</th>
                  <th className="py-3 px-6 text-right">Service Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {districtPerformanceData.map((d) => {
                  let healthLabel = 'Exemplary Delivery';
                  let healthBadge: BadgeVariant = 'positive';
                  if (d.avgRating < 2.8 || d.negativeRate >= 40) {
                    healthLabel = 'Audit Required';
                    healthBadge = 'negative';
                  } else if (d.avgRating < 3.8) {
                    healthLabel = 'Balanced Delivery';
                    healthBadge = 'neutral';
                  }

                  return (
                    <tr key={d.district} className="hover:bg-stone-50/80">
                      <td className="py-3.5 px-6 font-semibold text-stone-900 whitespace-nowrap">
                        {d.district}
                      </td>
                      <td className="py-3.5 px-4 font-mono">{d.count}</td>
                      <td className="py-3.5 px-4 font-bold text-stone-900">★ {d.avgRating} / 5.0</td>
                      <td className="py-3.5 px-4 text-emerald-700 font-medium">{d.positiveRate}%</td>
                      <td className="py-3.5 px-4 text-red-600 font-medium">{d.negativeRate}%</td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <Badge variant={healthBadge}>
                          {healthLabel}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Sentiment Trends */}
      {activeTab === 'trends' && (
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Citizen Satisfaction Trends Over Time</h3>
            <p className="text-xs text-stone-500">Tracking daily rating fluctuations across active records</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6E7571' }} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#6E7571' }} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="avg"
                  name="Average Daily Satisfaction"
                  stroke="#46664F"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Tab 4: Keyword Rankings */}
      {activeTab === 'keywords' && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              Most Frequently Occurring Feedback Themes
            </h3>
            <p className="text-xs text-stone-500">
              Extracted from citizen descriptions and summary comments
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {keywordRanking.map((item, idx) => {
              const isNegative = item.type === 'negative';
              return (
                <div
                  key={item.keyword}
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isNegative
                      ? 'bg-red-50/60 border-red-200 text-red-900'
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-stone-400">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold capitalize">{item.keyword}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                    isNegative ? 'bg-red-200/80 text-red-950' : 'bg-emerald-200/80 text-emerald-950'
                  }`}>
                    {item.count} mentions
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
