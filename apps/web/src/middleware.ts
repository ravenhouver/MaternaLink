import { NextResponse, type NextRequest } from 'next/server';

type UserRole = 'BIDAN_PUSKESMAS' | 'IFK_ADMIN' | 'SUPER_ADMIN';

const SESSION_COOKIE = 'maternalink_session';
const DEFAULT_SECRET = 'maternalink-local-dev-secret';

const protectedRoutes: Array<{ href: string; roles: UserRole[] }> = [
  { href: '/admin/facility-profiles', roles: ['SUPER_ADMIN'] },
  { href: '/admin/health-centers', roles: ['SUPER_ADMIN'] },
  { href: '/admin/medicines', roles: ['SUPER_ADMIN'] },
  { href: '/admin/users', roles: ['SUPER_ADMIN'] },
  { href: '/admin', roles: ['SUPER_ADMIN'] },
  { href: '/patients', roles: ['BIDAN_PUSKESMAS'] },
  { href: '/queue', roles: ['BIDAN_PUSKESMAS'] },
  { href: '/forecast-calendar', roles: ['BIDAN_PUSKESMAS'] },
  { href: '/medicine-needs', roles: ['BIDAN_PUSKESMAS'] },
  { href: '/deliveries', roles: ['BIDAN_PUSKESMAS'] },
  { href: '/ifk/decision-history', roles: ['IFK_ADMIN'] },
  { href: '/ifk/environment', roles: ['IFK_ADMIN'] },
  { href: '/ifk/clinics', roles: ['IFK_ADMIN'] },
  { href: '/ifk/recommendations', roles: ['IFK_ADMIN'] },
  { href: '/ifk', roles: ['IFK_ADMIN'] },
  { href: '/dashboard', roles: ['BIDAN_PUSKESMAS'] },
  { href: '/', roles: ['BIDAN_PUSKESMAS'] },
];

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return atob(padded);
}

function base64UrlEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(process.env.JWT_SECRET ?? DEFAULT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return base64UrlEncode(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}

async function verifySessionRole(token?: string): Promise<UserRole | null> {
  try {
    if (!token) return null;
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    if ((await sign(`${header}.${payload}`)) !== signature) return null;

    const parsed = JSON.parse(base64UrlDecode(payload)) as { exp?: number; role?: UserRole };
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    if (!parsed.role || !['BIDAN_PUSKESMAS', 'IFK_ADMIN', 'SUPER_ADMIN'].includes(parsed.role)) return null;
    return parsed.role;
  } catch {
    return null;
  }
}

function defaultRoute(role: UserRole) {
  if (role === 'SUPER_ADMIN') return '/admin';
  if (role === 'IFK_ADMIN') return '/ifk';
  return '/dashboard';
}

function routeRoles(pathname: string) {
  return protectedRoutes.find((route) => pathname === route.href || pathname.startsWith(`${route.href}/`))?.roles;
}

function redirect(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function middleware(request: NextRequest) {
  const role = await verifySessionRole(request.cookies.get(SESSION_COOKIE)?.value);
  const pathname = request.nextUrl.pathname;

  if (pathname === '/login') {
    return role ? redirect(request, defaultRoute(role)) : NextResponse.next();
  }

  const roles = routeRoles(pathname);
  if (!roles) return NextResponse.next();
  if (!role) return redirect(request, '/login');
  if (!roles.includes(role)) return redirect(request, defaultRoute(role));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
