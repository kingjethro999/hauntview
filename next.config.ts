import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: [
    'playwright',
    'playwright-core',
    '@axe-core/playwright',
    'better-sqlite3',
  ],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; connect-src 'self' https: wss:; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
