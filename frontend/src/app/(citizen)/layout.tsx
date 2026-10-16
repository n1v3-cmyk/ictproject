import React from 'react';
import { CitizenNavbar } from '@/components/citizen/CitizenNavbar';
import { CitizenFooter } from '@/components/citizen/CitizenFooter';

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <CitizenNavbar />
      <main className="flex-1">{children}</main>
      <CitizenFooter />
    </div>
  );
}
