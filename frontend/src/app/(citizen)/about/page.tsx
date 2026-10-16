'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  FileText,
  BarChart3,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Mail,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export default function AboutPrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Page Header */}
      <div className="border-b border-[#E5E9E6] pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2ED] text-xs font-semibold text-[#38523F] mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-[#46664F]" />
          <span>Governance & Civic Privacy Charter</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
          About CivicConnect & Responsible Data Handling
        </h1>
        <p className="text-base sm:text-lg text-stone-600 mt-2 leading-relaxed">
          CivicConnect is an analytical intelligence platform designed to systematically measure public service quality across Kerala departments and guide evidence-based administrative reforms.
        </p>
      </div>

      {/* Purpose & Platform Vision */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-stone-900">1. Purpose and Philosophy</h2>
        <div className="prose prose-stone text-sm text-stone-600 leading-relaxed space-y-3">
          <p>
            Citizens interact with government services daily—whether registering land, renewing driving licenses, seeking medical care at public health centers, or accessing subsidized commodities through the Public Distribution System (PDS). Traditional grievance portals often focus on resolving individual tickets rather than identifying systemic bottlenecks.
          </p>
          <p>
            CivicConnect fills this critical gap. Rather than functioning as a complaint redressal desk, the platform aggregates hundreds of citizen reviews into actionable operational indicators. By analyzing sentiment, response time perceptions, and geospatial clustering, senior administrative secretaries can identify:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-stone-700">
            <li>Taluks experiencing prolonged processing delays for vital certificates.</li>
            <li>Offices facing acute frontline staffing deficits or training gaps.</li>
            <li>Digital portal bottlenecks, such as recurring payment gateway failures or biometric mismatches.</li>
            <li>Exemplary service centers whose best practices can be replicated statewide.</li>
          </ul>
        </div>
      </section>

      {/* Distinction from Grievance Redressal */}
      <div className="p-5 rounded-2xl bg-[#FEF8EB] border border-[#FDE68A] flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
        <div className="text-xs text-[#92400E] space-y-1.5">
          <h4 className="font-semibold text-sm">Clear Distinction: Feedback Analysis vs Complaint Redressal</h4>
          <p className="leading-relaxed">
            Please note that CivicConnect is <strong>not</strong> an individual grievance redressal system. Submitting feedback does not create a formal legal case or petition ticket for dispute resolution. If you have an urgent dispute requiring statutory arbitration or official compensation, please utilize the Chief Minister’s Distress Relief Fund (CMDRF) or respective departmental appellate authorities.
          </p>
        </div>
      </div>

      {/* Data Collection & Use */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-stone-900">2. Information Collected & How It Is Used</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#EBF2ED] text-[#46664F] flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="font-semibold text-sm text-stone-900">Office & Jurisdiction</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                The district, taluk, department, and specific transaction are recorded to plot geographic density maps and department comparison rankings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#EBF2ED] text-[#46664F] flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="font-semibold text-sm text-stone-900">Multi-Dimensional Ratings</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Overall satisfaction and 4 dimension scores (Helpfulness, Communication, Professionalism, Response Time) form aggregate service health indexes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#EBF2ED] text-[#46664F] flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="font-semibold text-sm text-stone-900">Narrative & Sentiment</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Written text is analyzed for constructive feedback keywords, recurring delay triggers, and overall sentiment distribution (Positive, Neutral, Negative).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#EBF2ED] text-[#46664F] flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h3 className="font-semibold text-sm text-stone-900">Supporting Media Context</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Photos of tokens, notice boards, or premises provide physical verification context for administrative review and facility audits.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Anonymity & Evidence Guidelines */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-stone-900">3. Anonymity & Sensitive Data Safeguards</h2>
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-[#46664F] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-stone-900 text-sm">Right to Anonymous Submission</h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Citizens may submit feedback with complete anonymity. When selected, no personal identifier, name, or phone number is collected or stored.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-3 border-t border-stone-100">
            <Lock className="w-5 h-5 text-[#46664F] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-stone-900 text-sm">Prohibition of Sensitive Personal Data</h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                In strict adherence to citizen data privacy best practices, citizens are instructed never to upload documents containing Aadhaar numbers, PAN cards, bank passwords, or private medical dossiers. Any media attached should strictly document public service conditions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source & Demonstration Note */}
      <section className="p-6 rounded-2xl bg-[#F2F7F4] border border-[#CADACF] space-y-3">
        <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#46664F]" />
          <span>Prototype Demonstration Status</span>
        </h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          CivicConnect is currently running in prototype demonstration mode with browser-local state storage and simulated Kerala administrative data. All mock geographic points and feedback submissions serve to validate the user experience, sentiment analysis pipeline, and administrative visualization suite.
        </p>
        <div className="pt-2 flex items-center gap-3">
          <Link
            href="/feedback"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#46664F] text-white hover:bg-[#38523F] transition-colors"
          >
            <span>Test Feedback Submission</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            <span>Open Admin Dashboard</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
