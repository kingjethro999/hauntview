import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Toaster } from 'sonner';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HauntView | Local Web Testing Engine',
  description:
    'Comprehensive local testing engine with 16 automated profiles for accessibility, responsiveness, i18n, performance, and resilience.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} dark h-full`}>
      <body className="min-h-full flex flex-col bg-[#0F0F14] text-[#F5F5FA] bg-gothic-grid antialiased">
        <Suspense fallback={<div className="h-16 bg-[#0F0F14]" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <Toaster position="bottom-right" theme="dark" richColors />
      </body>
    </html>
  );
}
