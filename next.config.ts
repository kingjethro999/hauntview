import fs from 'node:fs';
import path from 'node:path';
import type { NextConfig } from 'next';

const versionFilePath = path.join(process.cwd(), 'VERSION');
const appVersion = fs.existsSync(versionFilePath)
  ? fs.readFileSync(versionFilePath, 'utf8').trim()
  : 'v0.1.0';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
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
