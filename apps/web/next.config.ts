import type { NextConfig } from 'next';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(currentDir, '..', '..');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: workspaceRoot,
  async redirects() {
    return [
      { source: '/', destination: '/dashboard', permanent: false },
      { source: '/master', destination: '/patients', permanent: false },
      { source: '/master/add-patient', destination: '/patients/new', permanent: false },
      { source: '/master/add-patient/manual', destination: '/patients/new/manual', permanent: false },
      { source: '/master/add-patient/upload', destination: '/patients/new/kia-upload', permanent: false },
      { source: '/inputs', destination: '/queue', permanent: false },
      { source: '/inputs/examination', destination: '/queue/examination', permanent: false },
      { source: '/forecast', destination: '/forecast-calendar', permanent: false },
      { source: '/lplpo', destination: '/medicine-needs', permanent: false },
      { source: '/distribution', destination: '/deliveries', permanent: false },
      { source: '/medicine-sender', destination: '/ifk', permanent: false },
      { source: '/medicine-sender/recommendations', destination: '/ifk/recommendations', permanent: false },
      { source: '/medicine-sender/clinics', destination: '/ifk/clinics', permanent: false },
      { source: '/medicine-sender/environment', destination: '/ifk/environment', permanent: false },
      { source: '/medicine-sender/decision-history', destination: '/ifk/decision-history', permanent: false },
    ];
  },
};

export default nextConfig;
