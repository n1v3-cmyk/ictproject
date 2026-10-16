'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useFeedback } from '@/context/FeedbackContext';
import { Spinner } from '@/components/ui/States';
import { X } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAdminLoggedIn, isLoading } = useFeedback();

  const isLoginPage = pathname === '/admin/login';

  // Client-side route guard. This is a UX convenience only — the authoritative
  // authorization check lives in the Django backend, which rejects unauthenticated
  // requests to admin endpoints with 401/403.
  useEffect(() => {
    if (!isLoginPage && !isLoading && !isAdminLoggedIn) {
      router.replace('/admin/login');
    }
  }, [isLoginPage, isLoading, isAdminLoggedIn, router]);

  // If on admin login page, render clean layout without sidebar
  if (isLoginPage) {
    return <div className="min-h-screen bg-canvas">{children}</div>;
  }

  if (isLoading || !isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Spinner label="Checking administrator session…" />
      </div>
    );
  }

  const getPageTitle = (path: string) => {
    if (path.includes('/admin/geo')) return 'Geographic Hotspot Analysis';
    if (path.includes('/admin/feedback')) return 'Citizen Feedback Explorer';
    if (path.includes('/admin/reports')) return 'Strategic Reports & Insights';
    if (path.includes('/admin/departments')) return 'Department & Service Management';
    return 'Executive Analytics Dashboard';
  };

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:shrink-0 h-full">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-xs bg-ink h-full shadow-2xl z-10">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
            <AdminSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AdminHeader
          title={getPageTitle(pathname)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
