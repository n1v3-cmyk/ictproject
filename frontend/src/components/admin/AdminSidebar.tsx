'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  ListFilter,
  BarChart3,
  Building2,
  ShieldCheck,
  LogOut,
  ExternalLink,
  ChevronRight,
  Database,
  RotateCcw,
} from 'lucide-react';
import { useFeedback } from '@/context/FeedbackContext';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export function AdminSidebar({ onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const { feedbacks, resetToDefaultData, logoutAdmin } = useFeedback();

  const navItems = [
    {
      name: 'Analytics Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      description: 'System overview & metrics',
    },
    {
      name: 'Geographic Hotspots',
      href: '/admin/geo',
      icon: MapPin,
      description: 'Kerala map & issue density',
    },
    {
      name: 'Feedback Explorer',
      href: '/admin/feedback',
      icon: ListFilter,
      description: 'Inspect individual records',
      badge: feedbacks.length,
    },
    {
      name: 'Reports & Insights',
      href: '/admin/reports',
      icon: BarChart3,
      description: 'Trends, keywords & CSV export',
    },
    {
      name: 'Departments & Services',
      href: '/admin/departments',
      icon: Building2,
      description: 'Catalog & hierarchy config',
    },
  ];

  return (
    <aside className="w-64 bg-ink text-stone-300 flex flex-col shrink-0 h-full border-r border-stone-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-stone-800/80 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sage-600 text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white tracking-tight text-sm">CivicConnect</span>
              <span className="text-[9px] uppercase tracking-wider bg-sage-700 text-sage-200 px-1.5 py-0.2 rounded font-bold">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-stone-400">Governance Intelligence</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] uppercase font-semibold text-stone-400 tracking-wider mb-2">
          Management & Analysis
        </p>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-sage-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-300'}`} />
                <span className="truncate">{item.name}</span>
              </div>

              {item.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                  isActive ? 'bg-sage-700 text-white' : 'bg-stone-800 text-stone-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Demo Controls & Citizen Portal Switcher */}
      <div className="p-3 border-t border-stone-800/80 space-y-2">
        <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 text-[11px] space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sage-650" />
              Demo State
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Local</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset local demo dataset to the 40 default seed records?')) {
                resetToDefaultData();
              }
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[10px] text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Seed Data</span>
          </button>
        </div>

        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Citizen Portal</span>
          </span>
          <ChevronRight className="w-3 h-3 text-stone-600" />
        </Link>

        <button
          type="button"
          onClick={logoutAdmin}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-red-400/80 hover:text-red-300 hover:bg-red-950/20 transition-colors"
        >
          <span className="flex items-center gap-2">
            <LogOut className="w-3.5 h-3.5" />
            <span>End Demo Session</span>
          </span>
        </button>
      </div>
    </aside>
  );
}
