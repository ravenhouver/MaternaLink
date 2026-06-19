'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { localeCookieName, localeLabels, locales, type AppLocale } from '@/i18n/config';

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const t = useTranslations('common');

  function setLocale(nextLocale: AppLocale) {
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  }

  return (
    <label className={className} aria-label={t('language')}>
      <span>{t('language')}</span>
      <select value={locale} onChange={(event) => setLocale(event.target.value as AppLocale)}>
        {locales.map((item) => <option value={item} key={item}>{localeLabels[item]}</option>)}
      </select>
    </label>
  );
}
