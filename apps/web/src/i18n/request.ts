import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isAppLocale, localeCookieName, type AppLocale } from './config';
import { getMessages } from './messages';

function localeFromAcceptLanguage(value: string | null): AppLocale {
  const matches = (value ?? '').split(',').map((item) => item.trim().split(';')[0]?.toLowerCase().split('-')[0]);
  return matches.find(isAppLocale) ?? defaultLocale;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : localeFromAcceptLanguage(headerStore.get('accept-language'));

  return {
    locale,
    messages: getMessages(locale),
  };
});
