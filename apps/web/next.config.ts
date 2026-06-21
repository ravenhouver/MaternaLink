import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(currentDir, '..', '..');
const apiInternalBaseUrl = process.env.API_INTERNAL_BASE_URL ?? 'http://localhost:3001/api';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: workspaceRoot,
  async redirects() {
    return [
      { source: '/', destination: '/dashboard', permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiInternalBaseUrl}/:path*` },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
