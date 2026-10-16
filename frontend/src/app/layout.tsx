import type { Metadata } from 'next';
import './globals.css';
import { FeedbackProvider } from '@/context/FeedbackContext';

export const metadata: Metadata = {
  title: 'CivicConnect | Smart Citizen Feedback & Service Improvement',
  description: 'A modern, transparent platform for citizens to evaluate public services and for administrators to analyze systemic improvements.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <FeedbackProvider>
          {children}
        </FeedbackProvider>
      </body>
    </html>
  );
}
