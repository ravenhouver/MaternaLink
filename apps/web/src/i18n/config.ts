export const locales = ['en', 'id', 'ms', 'fil', 'th', 'vi', 'km', 'lo', 'my', 'zh', 'ta'] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';

export const localeCookieName = 'NEXT_LOCALE';

export const localeLabels: Record<AppLocale, string> = {
  en: 'English',
  id: 'Indonesia',
  ms: 'Melayu',
  fil: 'Filipino',
  th: '\u0e44\u0e17\u0e22',
  vi: 'Tieng Viet',
  km: '\u1781\u17d2\u1798\u17c2\u179a',
  lo: '\u0ea5\u0eb2\u0ea7',
  my: '\u1019\u103c\u1014\u103a\u1019\u102c',
  zh: '\u4e2d\u6587',
  ta: '\u0ba4\u0bae\u0bbf\u0bb4\u0bcd',
};

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return Boolean(value && (locales as readonly string[]).includes(value));
}
