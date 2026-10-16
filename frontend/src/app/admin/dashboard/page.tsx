'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  MessageSquare,
  Star,
  ThumbsUp,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Layers,
} from 'lucide-react';
import { useFeedback } from '@/context/FeedbackContext';
import { FilterBar } from '@/components/admin/FilterBar';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/StarRating';
import { SentimentBadge } from '@/components/ui/Badge';

const SENTIMENT_COLORS = {
  positive: '#22C55E',
  neutral: '#F59E0B',
  negative: '#EF4444',
};

export default function AnalyticsDashboardPage() {
  const { filteredFeedbacks, feedbacks, departments } = useFeedback();

  // Core KPI Calculations based on filteredFeedbacks
  const total = filteredFeedbacks.length;
  const avgRating = total > 0
    ? (filteredFeedbacks.reduce((acc, f) => acc + f.overallRating, 0) / total).toFixed(2)
    : '0.00';

  const positiveCount = filteredFeedbacks.filter((f) => f.sentiment === 'positive').length;
  const neutralCount = filteredFeedbacks.filter((f) => f.sentiment === 'neutral').length;
  const negativeCount = filteredFeedbacks.filter((f) => f.sentiment === 'negative').length;

  const positivePct = total > 0 ? Math.round((positiveCount / total) * 100) : 0;
  const neutralPct = total > 0 ? Math.round((neutralCount / total) * 100) : 0;
  const negativePct = total > 0 ? Math.round((negativeCount / total) * 100) : 0;

  // Sentiment Donut Data
  const sentimentChartData = useMemo(() => [
    { name: 'Positive', value: positiveCount, color: SENTIMENT_COLORS.positive },
    { name: 'Neutral', value: neutralCount, color: SENTIMENT_COLORS.neutral },
    { name: 'Negative', value: negativeCount, color: SENTIMENT_COLORS.negative },
  ], [positiveCount, neutralCount, negativeCount]);

  // Department-wise Average Rating Bar Data
  const departmentChartData = useMemo(() => {
    return departments.map((dept) => {
      const deptFeedbacks = filteredFeedbacks.filter((f) => f.departmentId === dept.id);
      const count = deptFeedbacks.length;
      const avg = count > 0
        ? Number((deptFeedbacks.reduce((a, b) => a + b.overallRating, 0) / count).toFixed(1))
        : 0;
      return {
        code: dept.code,
        name: dept.name,
        averageRating: avg,
        count,
      };
    }).filter((d) => d.count > 0);
  }, [departments, filteredFeedbacks]);

  // Volume & Sentiment Timeline Data (by date)
  const timelineData = useMemo(() => {
    const dateMap: Record<string, { date: string; positive: number; neutral: number; negative: number; total: number }> = {};

    // Sort ascending by date
    const sorted = [...filteredFeedbacks].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sorted.forEach((item) => {
      const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = { date: dateStr, positive: 0, neutral: 0, negative: 0, total: 0 };
      }
      dateMap[dateStr][item.sentiment] += 1;
      dateMap[dateStr].total += 1;
    });

    return Object.values(dateMap).slice(-10); // Last 10 date clusters
  }, [filteredFeedbacks]);

  // Top Friction & Positive Keywords from filtered records
  const { topFrictionKeywords, topPositiveKeywords } = useMemo(() => {
    const negativeKws: Record<string, number> = {};
    const positiveKws: Record<string, number> = {};

    filteredFeedbacks.forEach((f) => {
      f.keywords.forEach((kw) => {
        if (f.sentiment === 'negative') {
          negativeKws[kw] = (negativeKws[kw] || 0) + 1;
        } else if (f.sentiment === 'positive') {
          positiveKws[kw] = (positiveKws[kw] || 0) + 1;
        }
      });
    });

    const sortFn = (obj: Record<string, number>) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return {
      topFrictionKeywords: sortFn(negativeKws),
      topPositiveKeywords: sortFn(positiveKws),
    };
  }, [filteredFeedbacks]);

  return (
    <div className="space-y-6">
      {/* Dynamic Global Filter Bar */}
      <FilterBar />

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Feedback */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Feedback</span>
            <div className="w-8 h-8 rounded-lg bg-[#EBF2ED] text-[#46664F] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900">{total}</span>
            <span className="text-xs text-stone-500 font-mono">
              of {feedbacks.length} total
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Verified citizen records</p>
        </Card>

        {/* Average Satisfaction */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Satisfaction</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900">{avgRating}</span>
            <span className="text-xs text-stone-400">/ 5.0</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Statewide benchmark</p>
        </Card>

        {/* Positive Sentiment Rate */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Constructive / Pos.</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-700">{positivePct}%</span>
            <span className="text-xs text-stone-500 font-mono">({positiveCount})</span>
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-1">Smooth & commendable service</p>
        </Card>

        {/* Negative / Bottleneck Rate */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Bottlenecks / Neg.</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-red-600">{negativePct}%</span>
            <span className="text-xs text-stone-500 font-mono">({negativeCount})</span>
          </div>
          <p className="text-[11px] text-red-500/80 mt-1">Requires administrative audit</p>
        </Card>
      </div>

      {/* Main Charts Row: Sentiment Donut & Department Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sentiment Distribution Donut Chart */}
        <Card className="lg:col-span-5 flex flex-col">
          <CardHeader className="py-4 px-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Sentiment Distribution</h3>
              <p className="text-xs text-stone-500">Classification of citizen experiences</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
              N = {total}
            </span>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            {total === 0 ? (
              <p className="text-xs text-stone-400 text-center py-10">No records match filters.</p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {sentimentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val} (${Math.round(((Number(val) || 0) / (total || 1)) * 100)}%)`, 'Count']}
                      contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="pt-4 border-t border-stone-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Positive</span>
                </div>
                <span className="text-stone-700 font-bold mt-0.5 block">{positivePct}%</span>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-amber-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Neutral</span>
                </div>
                <span className="text-stone-700 font-bold mt-0.5 block">{neutralPct}%</span>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-red-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Negative</span>
                </div>
                <span className="text-stone-700 font-bold mt-0.5 block">{negativePct}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department-wise Rating Bar Chart */}
        <Card className="lg:col-span-7 flex flex-col">
          <CardHeader className="py-4 px-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Department Performance Comparison</h3>
              <p className="text-xs text-stone-500">Average satisfaction rating (1.0 - 5.0) by sector</p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs text-[#46664F] hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>Detailed Report</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-6 flex-1">
            {departmentChartData.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-10">No department data matches filters.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F0" />
                    <XAxis
                      dataKey="code"
                      tick={{ fontSize: 11, fill: '#6E7571' }}
                      interval={0}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fontSize: 11, fill: '#6E7571' }}
                    />
                    <Tooltip
                      formatter={(val: any, name?: any, item?: any) => [
                        `${val} / 5.0 (${item?.payload?.count || 0} reviews)`,
                        item?.payload?.name || name,
                      ]}
                      contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                    <Bar dataKey="averageRating" fill="#46664F" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-[11px] text-stone-400 text-center mt-2">
              REV: Revenue • MVD: Motor Vehicles • HFW: Health • CSCA: Civil Supplies • LSGD: Local Govt • KSEB: Power • KWA: Water • GED: Education
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart & Recurring Issue Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feedback Volume over Time */}
        <Card className="lg:col-span-7">
          <CardHeader className="py-4 px-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Feedback Volume & Trends Over Time</h3>
              <p className="text-xs text-stone-500">Distribution of submissions across recent dates</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#46664F]" />
                Volume
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F2F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6E7571' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6E7571' }} />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', fontSize: '12px' }} />
                  <Bar dataKey="positive" name="Positive" stackId="a" fill="#22C55E" />
                  <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="negative" name="Negative" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Frequently Reported Issues & Commendations */}
        <Card className="lg:col-span-5 flex flex-col">
          <CardHeader className="py-4 px-6">
            <h3 className="text-sm font-semibold text-stone-900">Recurring Pattern Keywords</h3>
            <p className="text-xs text-stone-500">Key issues flagged vs positive indicators</p>
          </CardHeader>
          <CardContent className="p-6 flex-1 space-y-5">
            {/* Friction Keywords */}
            <div>
              <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5 mb-2.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Frequently Reported Friction Points</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {topFrictionKeywords.length === 0 ? (
                  <span className="text-xs text-stone-400">No negative friction keywords in filtered set.</span>
                ) : (
                  topFrictionKeywords.map(([kw, count]) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-lg text-xs bg-red-50 text-red-700 border border-red-200 font-medium flex items-center gap-1.5"
                    >
                      <span>{kw}</span>
                      <span className="w-4 h-4 rounded-full bg-red-200/80 text-red-900 text-[10px] flex items-center justify-center font-mono">
                        {count}
                      </span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Positive Indicators */}
            <div className="pt-4 border-t border-stone-100">
              <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5 mb-2.5">
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Commended Service Aspects</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {topPositiveKeywords.length === 0 ? (
                  <span className="text-xs text-stone-400">No positive keywords in filtered set.</span>
                ) : (
                  topPositiveKeywords.map(([kw, count]) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-lg text-xs bg-[#EBF7EE] text-[#1E6B35] border border-[#C6E8CD] font-medium flex items-center gap-1.5"
                    >
                      <span>{kw}</span>
                      <span className="w-4 h-4 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] flex items-center justify-center font-mono">
                        {count}
                      </span>
                    </span>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback Preview Table */}
      <Card>
        <CardHeader className="py-4 px-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Recent Citizen Feedback</h3>
            <p className="text-xs text-stone-500">Showing latest records matching active filters</p>
          </div>
          <Link
            href="/admin/feedback"
            className="text-xs font-semibold text-[#46664F] hover:text-[#38523F] inline-flex items-center gap-1"
          >
            <span>Open Feedback Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF5F5]/40 border-y border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Reference</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Sentiment</th>
                <th className="py-3 px-4">Summary Comment</th>
                <th className="py-3 px-6 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredFeedbacks.slice(0, 5).map((f) => (
                <tr key={f.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-medium text-stone-900 whitespace-nowrap">
                    {f.referenceId}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-medium text-stone-800">{f.location.district}</span>
                    <span className="text-stone-400 block text-[11px]">{f.location.localArea}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-stone-900 block truncate max-w-xs">{f.serviceName}</span>
                    <span className="text-stone-400 text-[11px] block">{f.departmentName}</span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StarRating value={f.overallRating} readOnly size="sm" />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <SentimentBadge sentiment={f.sentiment} score={f.sentimentScore} />
                  </td>
                  <td className="py-3.5 px-4 max-w-md truncate text-stone-600">
                    {f.summaryComment}
                  </td>
                  <td className="py-3.5 px-6 text-right text-stone-400 whitespace-nowrap font-mono text-[11px]">
                    {new Date(f.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
              {filteredFeedbacks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400 text-xs">
                    No feedback items match active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
