import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CREATOR OUTREACH ENGINE // AI DUB & DEV SUITE',
  description: 'Production-grade YouTuber cold outreach & email automation suite tapping 250M+ Bengali demographic.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0F17] text-slate-200 antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
