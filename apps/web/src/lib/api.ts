export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';

export type UserRole = 'BIDAN_PUSKESMAS' | 'IFK_ADMIN' | 'SUPER_ADMIN';

export type CurrentUser = {
  id: string;
  username: string;
  displayName?: string;
  role: UserRole;
  puskesmasId: string | null;
};

export type ApiReachability = {
  ok: boolean;
  status?: number;
  message: string;
};

export async function checkApiReachability(): Promise<ApiReachability> {
  try {
    const response = await fetch(`${apiBaseUrl}/master/puskesmas`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: `API returned HTTP ${response.status}`,
      };
    }

    return {
      ok: true,
      status: response.status,
      message: 'API reachable',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown API connection error';

    return {
      ok: false,
      message,
    };
  }
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[]; error?: string };
    if (Array.isArray(body.message)) return body.message.join(', ');
    return body.message ?? body.error ?? `API returned HTTP ${response.status}`;
  } catch {
    return response.text().catch(() => `API returned HTTP ${response.status}`);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) throw new Error(await readError(response));
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function login(username: string, password: string): Promise<CurrentUser> {
  return apiFetch<CurrentUser>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export async function logout(): Promise<void> {
  await apiFetch<void>('/auth/logout', { method: 'POST' });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await apiFetch<CurrentUser>('/auth/me');
  } catch {
    return null;
  }
}
