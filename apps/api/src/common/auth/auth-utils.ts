import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import type { CurrentUser } from './current-user';

const SESSION_COOKIE = 'maternalink_session';
const DEFAULT_SECRET = 'maternalink-local-dev-secret';

function jwtSecret() {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production');
  return process.env.JWT_SECRET ?? DEFAULT_SECRET;
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function sign(value: string) {
  return createHmac('sha256', jwtSecret()).update(value).digest('base64url');
}

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expectedHash] = stored.split(':');
  if (!salt || !expectedHash) return false;
  const actual = Buffer.from(scryptSync(password, salt, 64).toString('hex'));
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createSessionToken(user: CurrentUser) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 }));
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

export function verifySessionToken(token?: string): CurrentUser | null {
  try {
    if (!token) return null;
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    if (sign(`${header}.${payload}`) !== signature) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as CurrentUser & { exp?: number };
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: parsed.id, username: parsed.username, role: parsed.role, puskesmasId: parsed.puskesmasId };
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  return Object.fromEntries(
    (cookieHeader ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=');
        return index === -1 ? [part, ''] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function buildSessionCookie(token: string) {
  const secureCookieEnv = process.env.SESSION_COOKIE_SECURE?.toLowerCase();
  const shouldUseSecureCookie = secureCookieEnv ? secureCookieEnv === 'true' : process.env.NODE_ENV === 'production';
  const secure = shouldUseSecureCookie ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${secure}`;
}

export function buildClearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}
