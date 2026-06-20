'use client';

import { useLocale, useTranslations } from 'next-intl';
import { localeCookieName, localeLabels, locales, type AppLocale } from '@/i18n/config';

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations('common');

  function setLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    window.location.reload();
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
