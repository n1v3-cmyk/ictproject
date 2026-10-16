'use client';

import React from 'react';
import Link from 'next/link';
import {
  MessageSquarePlus,
  Landmark,
  Car,
  Stethoscope,
  ShoppingBag,
  Building2,
  Zap,
  Droplets,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  Users2,
  FileText,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useFeedback } from '@/context/FeedbackContext';
import { Card, CardContent } from '@/components/ui/Card';

const DEPARTMENT_ICONS: Record<string, React.ReactNode> = {
  'dept-revenue': <Landmark className="w-6 h-6 text-[#46664F]" />,
  'dept-mvd': <Car className="w-6 h-6 text-[#46664F]" />,
  'dept-health': <Stethoscope className="w-6 h-6 text-[#46664F]" />,
  'dept-civil-supplies': <ShoppingBag className="w-6 h-6 text-[#46664F]" />,
  'dept-lsgd': <Building2 className="w-6 h-6 text-[#46664F]" />,
  'dept-kseb': <Zap className="w-6 h-6 text-[#46664F]" />,
  'dept-kwa': <Droplets className="w-6 h-6 text-[#46664F]" />,
  'dept-education': <GraduationCap className="w-6 h-6 text-[#46664F]" />,
};

export default function CitizenHomePage() {
  const { departments, feedbacks } = useFeedback();

  // Aggregate stats
  const totalFeedbacks = feedbacks.length;
  const avgRating = (feedbacks.reduce((acc, f) => acc + f.overallRating, 0) / (totalFeedbacks || 1)).toFixed(1);
  const positiveCount = feedbacks.filter((f) => f.sentiment === 'positive').length;
  const positivePercent = Math.round((positiveCount / (totalFeedbacks || 1)) * 100);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-20 border-b border-[#E5E9E6] bg-gradient-to-b from-[#F2F7F4]/60 via-[#FBFBF9] to-[#FBFBF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Pill notice */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF2ED] border border-[#CADACF] text-xs font-medium text-[#2C4032] mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#46664F]" />
              <span>Civic Service Analysis Initiative — Government of Kerala</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-stone-900 leading-[1.12]">
              Shape Better Public Services With Your Honest Voice
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-stone-600 leading-relaxed max-w-2xl">
              CivicConnect enables citizens to evaluate public offices across Kerala. Your experiences are aggregated to highlight recurring bottlenecks, recognize dedicated staff, and guide systemic administrative reforms.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/feedback"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-medium bg-[#46664F] text-white hover:bg-[#38523F] shadow-sm hover:shadow-md transition-all group"
              >
                <MessageSquarePlus className="w-5 h-5" />
                <span>Share Service Feedback</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <a
                href="#departments"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-base font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 shadow-2xs transition-colors"
              >
                <span>Browse Departments</span>
              </a>
            </div>

            {/* Quick Live Stats */}
            <div className="mt-12 pt-8 border-t border-stone-200/80 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#46664F]">{totalFeedbacks}</p>
                <p className="text-xs text-stone-500 mt-1">Verified Submissions</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-stone-900">{avgRating} <span className="text-base text-stone-400 font-normal">/ 5.0</span></p>
                <p className="text-xs text-stone-500 mt-1">Average Satisfaction</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{positivePercent}%</p>
                <p className="text-xs text-stone-500 mt-1">Constructive / Positive</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-stone-900">14</p>
                <p className="text-xs text-stone-500 mt-1">Districts Represented</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Purpose & Distinction Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF5F5]/60 border border-[#E8D7D8] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8B4848] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#8B4848]" />
              <span>Platform Mission & Understanding</span>
            </div>
            <h3 className="text-xl font-semibold text-stone-900">
              A Systemic Improvement Platform — Not a Grievance Ticket Desk
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              CivicConnect analyzes feedback patterns across departments and geographic locations to help policymakers detect chronic delays, staff shortages, and digital portal failures. We do not process individual complaint redressal or dispute adjudications.
            </p>
          </div>
          <Link
            href="/about"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <span>Learn How It Works</span>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </Link>
        </div>
      </section>

      {/* "How It Works" 3-Step Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-xs font-semibold text-[#46664F] uppercase tracking-wider mb-2">Simple, Guided Process</h2>
          <p className="text-2xl sm:text-3xl font-semibold text-stone-900">How Your Feedback Transforms Governance</p>
          <p className="text-sm sm:text-base text-stone-500 mt-3">
            In less than 3 minutes, provide structured input that directly informs department heads and administrative reform committees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl border border-[#E5E9E6] p-7 shadow-xs relative flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-[#EBF2ED] text-[#46664F] flex items-center justify-center font-bold text-lg mb-5">
              01
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Select Office & Service</h3>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              Choose your Kerala district, taluk, government department, and specific transaction (e.g. Land Mutation, Driving License, Hospital OPD, Ration Card).
            </p>
            <div className="mt-auto pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-500">
              <CheckCircle2 className="w-4 h-4 text-[#46664F]" />
              <span>Supports all 14 Kerala districts</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border border-[#E5E9E6] p-7 shadow-xs relative flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-[#EBF2ED] text-[#46664F] flex items-center justify-center font-bold text-lg mb-5">
              02
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Rate & Provide Details</h3>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              Rate overall satisfaction along with key dimensions: helpfulness, communication, professionalism, and response time. Add comments and optional evidence photos.
            </p>
            <div className="mt-auto pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-500">
              <CheckCircle2 className="w-4 h-4 text-[#46664F]" />
              <span>Full anonymous submission option</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border border-[#E5E9E6] p-7 shadow-xs relative flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-[#EBF2ED] text-[#46664F] flex items-center justify-center font-bold text-lg mb-5">
              03
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Data Drives Change</h3>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              Your feedback is analyzed alongside thousands of others to detect problem clusters on geographic maps, evaluate departmental performance, and allocate resources.
            </p>
            <div className="mt-auto pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-500">
              <CheckCircle2 className="w-4 h-4 text-[#46664F]" />
              <span>Direct visibility for senior administrators</span>
            </div>
          </div>
        </div>
      </section>

      {/* Department Cards Section */}
      <section id="departments" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xs font-semibold text-[#46664F] uppercase tracking-wider mb-2">Key Sectors</h2>
            <p className="text-2xl sm:text-3xl font-semibold text-stone-900">Participating Government Departments</p>
            <p className="text-sm text-stone-500 mt-1">Select a department to directly initiate your feedback submission.</p>
          </div>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#46664F] hover:text-[#38523F]"
          >
            <span>All Services</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {departments.map((dept) => {
            const deptFeedbacks = feedbacks.filter((f) => f.departmentId === dept.id);
            const deptAvg = deptFeedbacks.length > 0
              ? (deptFeedbacks.reduce((a, b) => a + b.overallRating, 0) / deptFeedbacks.length).toFixed(1)
              : '4.2';

            return (
              <Card key={dept.id} hoverEffect className="flex flex-col justify-between">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-[#EBF2ED] flex items-center justify-center mb-4">
                    {DEPARTMENT_ICONS[dept.id] || <Building2 className="w-6 h-6 text-[#46664F]" />}
                  </div>

                  <h3 className="font-semibold text-base text-stone-900 mb-1 line-clamp-1">{dept.name}</h3>
                  <p className="text-xs text-stone-500 mb-4 line-clamp-2 leading-relaxed">{dept.description}</p>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <span>{dept.services.length} Public Services</span>
                    <span className="font-medium text-stone-800 flex items-center gap-1">
                      ★ {deptAvg} ({deptFeedbacks.length})
                    </span>
                  </div>
                </CardContent>

                <div className="p-4 bg-[#FBFBF9] border-t border-[#F0F2F0] rounded-b-2xl">
                  <Link
                    href={`/feedback?dept=${dept.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-[#38523F] bg-[#EBF2ED] hover:bg-[#DCE9E0] transition-colors"
                  >
                    <span>Give Feedback</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Responsible Data and Privacy Assurance */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-[#E5E9E6] p-8 sm:p-12 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#46664F] uppercase tracking-wider">
              <Lock className="w-4 h-4" />
              <span>Civic Privacy & Data Ethics</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-stone-900">
              Safe, Responsible, and Transparent Citizen Participation
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
              We uphold the highest standard of civic privacy. Citizens can choose complete anonymity when rating any office. Submitted text and ratings are processed into aggregate statistics, trends, and geospatial heatmaps. We explicitly advise against attaching documents containing sensitive financial or identity details.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium text-stone-600">
              <span className="flex items-center gap-1.5 bg-[#FBFBF9] px-3 py-1.5 rounded-lg border border-stone-200">
                ✓ No mandatory sign-in required
              </span>
              <span className="flex items-center gap-1.5 bg-[#FBFBF9] px-3 py-1.5 rounded-lg border border-stone-200">
                ✓ OpenStreetMap geographic transparency
              </span>
              <span className="flex items-center gap-1.5 bg-[#FBFBF9] px-3 py-1.5 rounded-lg border border-stone-200">
                ✓ Regular public analytical summaries
              </span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#F2F7F4] rounded-2xl p-6 border border-[#CADACF] text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#46664F] text-white flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-stone-900">Are you a Public Officer?</h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Log in to the administrative analytics portal to view department satisfaction trends, district maps, and feedback explorer.
              </p>
            </div>
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#46664F] text-white hover:bg-[#38523F] transition-colors"
            >
              <span>Access Admin Suite</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
