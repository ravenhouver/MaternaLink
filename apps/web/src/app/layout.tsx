import 'antd/dist/reset.css';
import 'leaflet/dist/leaflet.css';
import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'MaternaLink Dashboard',
  description: 'Dashboard shell for MaternaLink supply-chain planning.',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
