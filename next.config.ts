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
};

export default nextConfig;
