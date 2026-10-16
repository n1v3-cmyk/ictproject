'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  FileText,
  Trash2,
  Server,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

const PRINCIPLES = [
  {
    icon: EyeOff,
    title: 'Anonymous by Default',
    body: 'You may submit feedback without providing any personal details. Anonymous submissions never display or expose a name or contact number anywhere in the system.',
  },
  {
    icon: Lock,
    title: 'No Device Tracking',
    body: 'We do not request, read, or store your device location automatically. The district and local area you choose are the only geographic data recorded.',
  },
  {
    icon: Server,
    title: 'Used Only for Service Improvement',
    body: 'Feedback is aggregated into departmental and geographic analytics. It is used to identify systemic service gaps, not to single out individual citizens.',
  },
  {
    icon: Trash2,
    title: 'Minimal Retention',
    body: 'Attachments and comments are retained only as long as needed for analysis and audit, in line with state records-management policy.',
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="border-b border-line pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage-100 text-xs font-semibold text-sage-700 mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
          <span>Data Protection Notice</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
          Privacy & Data Handling
        </h1>
        <p className="text-base sm:text-lg text-muted mt-2 leading-relaxed">
          This notice explains what CivicConnect collects when you share feedback, how it is used, and
          the choices available to you.
        </p>
      </div>

      <section className="grid sm:grid-cols-2 gap-4">
        {PRINCIPLES.map((principle) => {
          const Icon = principle.icon;
          return (
            <Card key={principle.title}>
              <CardContent className="p-5 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-sage-100 text-sage-600 flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <h2 className="text-sm font-semibold text-ink">{principle.title}</h2>
                <p className="text-xs text-muted leading-relaxed">{principle.body}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
          <FileText className="w-4.5 h-4.5 text-sage-600" />
          What we collect
        </h2>
        <ul className="text-sm text-muted leading-relaxed space-y-2 list-disc pl-5">
          <li>The service and office you are commenting on, and the district / local area you select.</li>
          <li>Your ratings and comments about the service experience.</li>
          <li>Optional attachments (photo, PDF, or short video) that you choose to upload.</li>
          <li>
            If — and only if — you opt into an identified submission, the name and contact detail you
            provide. Identified details are never shown in aggregated analytics.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
          <CheckCircle2 className="w-4.5 h-4.5 text-sage-600" />
          Your choices
        </h2>
        <ul className="text-sm text-muted leading-relaxed space-y-2 list-disc pl-5">
          <li>Submit anonymously at any time — no account is required to share feedback.</li>
          <li>Attach evidence only when you are comfortable sharing it.</li>
          <li>
            Ask for your identified submission to be reviewed or removed by quoting its reference number
            to the department concerned.
          </li>
        </ul>
      </section>

      <div className="p-5 rounded-2xl bg-sage-50 border border-sage-200 flex items-start gap-4">
        <ShieldCheck className="w-5 h-5 text-sage-600 shrink-0 mt-0.5" />
        <div className="text-xs text-ink-strong space-y-1.5">
          <h4 className="font-semibold text-sm">Questions about your data?</h4>
          <p className="leading-relaxed">
            Contact the nodal officer for the department you interacted with, or read the full governance
            charter on the{' '}
            <Link href="/about" className="text-sage-700 font-medium underline underline-offset-2">
              About page
            </Link>
            .
          </p>
        </div>
      </div>

      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
