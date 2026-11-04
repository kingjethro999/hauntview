import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import './haunting.css';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Toaster } from 'sonner';
import { AtmosphereLayer } from './components/features/AtmosphereLayer';
import { HauntingEffects } from './components/features/HauntingEffects';

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0711',
};

export const metadata: Metadata = {
  title: 'HauntView | Local Web Testing Engine',
  description:
    'Comprehensive local testing engine with 25 automated profiles for resilience, accessibility, responsiveness, i18n, performance, and security.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} dark h-full`}>
      <head>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="screen-orientation" content="portrait-primary" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
                  if (lang.indexOf('ar') === 0 || lang.indexOf('he') === 0 || lang.indexOf('fa') === 0 || lang.indexOf('ur') === 0) {
                    document.documentElement.setAttribute('dir', 'rtl');
                    document.documentElement.setAttribute('lang', lang);
                  } else if (lang.indexOf('ja') === 0) {
                    document.documentElement.setAttribute('lang', 'ja');
                  } else if (lang.indexOf('hi') === 0) {
                    document.documentElement.setAttribute('lang', 'hi');
                  } else if (lang) {
                    document.documentElement.setAttribute('lang', lang);
                  }
                  if ('serviceWorker' in navigator && window.location.protocol.indexOf('http') === 0) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').catch(function() {});
                    });
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ background: '#100d13', color: '#fff1dc' }}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#ff791f] focus:text-[#0a0711] focus:font-semibold focus:rounded-md focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <AtmosphereLayer />
        <HauntingEffects />
        <Suspense fallback={<div className="h-16 bg-[#0a0711]" />}>
          <Navbar />
        </Suspense>
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 flex flex-col w-full max-w-[2560px] mx-auto focus:outline-none"
        >
          {children}
        </main>
        <Footer />
        <Toaster position="bottom-right" theme="dark" richColors />
      </body>
    </html>
  );
}
