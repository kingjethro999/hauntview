import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Cormorant_Garamond, Inter, JetBrains_Mono, UnifrakturMaguntia } from 'next/font/google';
import './globals.css';
import './haunting.css';
import './nocturne.css';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Toaster } from 'sonner';
import NextTopLoader from 'nextjs-toploader';
import { AtmosphereLayer } from './components/features/AtmosphereLayer';

// Display: high-contrast Garamond for headings — elegant, a little funereal.
const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

// Blackletter is reserved for the wordmark only.
const unifraktur = UnifrakturMaguntia({
  variable: '--font-unifraktur',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

// Body: Inter for long-form readability at small sizes.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// Data: URLs, timings, counts.
const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#07060d',
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cormorant.variable} ${unifraktur.variable} ${inter.variable} ${jetbrains.variable} dark h-full`}
    >
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
      <body className="min-h-full flex flex-col antialiased">
        <a
          id="skip-link"
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--pumpkin-fire)] focus:text-[var(--midnight-veil)] focus:font-semibold focus:rounded-md focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <NextTopLoader
          color="var(--pumpkin-fire)"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px var(--pumpkin-fire),0 0 5px var(--pumpkin-fire)"
          zIndex={99999}
          showForHashAnchor={true}
        />
        <AtmosphereLayer />
        <Suspense fallback={<div className="h-[72px]" />}>
          <Navbar />
        </Suspense>
        <main id="main" tabIndex={-1} className="flex-1 flex flex-col w-full focus:outline-none">
          {children}
        </main>
        <Footer />
        <Toaster position="bottom-right" theme="dark" richColors />
      </body>
    </html>
  );
}
