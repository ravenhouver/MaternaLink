import 'antd/dist/reset.css';
import 'leaflet/dist/leaflet.css';
import './globals.css';

import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { defaultLocale, isAppLocale, localeCookieName, type AppLocale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';

export const metadata: Metadata = {
  title: 'MaternaLink Dashboard',
  description: 'Dashboard shell for MaternaLink supply-chain planning.',
};

type RootLayoutProps = {
  children: ReactNode;
};

function localeFromAcceptLanguage(value: string | null): AppLocale {
  const matches = (value ?? '').split(',').map((item) => item.trim().split(';')[0]?.toLowerCase().split('-')[0]);
  return matches.find(isAppLocale) ?? defaultLocale;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : localeFromAcceptLanguage(headerStore.get('accept-language'));

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={getMessages(locale)}>
          <AppShell>{children}</AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
