export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';

export type UserRole = 'BIDAN_PUSKESMAS' | 'IFK_ADMIN' | 'SUPER_ADMIN';

export type CurrentUser = {
  id: string;
  username: string;
  displayName?: string;
  role: UserRole;
  puskesmasId: string | null;
};

export type PregnancyRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type QueueStatus = 'WAITING' | 'EXAMINING' | 'COMPLETED' | 'CANCELLED';
export type ExaminationSource = 'MANUAL' | 'VOICE_TRANSCRIPT_FALLBACK' | 'VOICE_TRANSCRIPT_AI';

export type PatientRecord = {
  id: string;
  fullName: string;
  nik: string;
  phone?: string | null;
  address?: string | null;
};

export type PregnancyRecord = {
  id: string;
  gestationalAge?: number | null;
  ancVisit?: string | null;
  riskLevel: PregnancyRiskLevel;
};

export type QueueRecord = {
  id: string;
  queueNo: string;
  assignedDoctor?: string | null;
  status: QueueStatus;
  queuedAt: string;
  patient: PatientRecord;
  pregnancy: PregnancyRecord;
};

export type CreatePatientPayload = {
  fullName: string;
  nik: string;
  phone?: string;
  address?: string;
  gestationalAge?: number;
  ancVisit?: string;
  riskLevel?: PregnancyRiskLevel;
};

export type CreateExaminationPayload = {
  queueId?: string;
  patientId: string;
  pregnancyId: string;
  source?: ExaminationSource;
  complaint?: string;
  gestationalAge?: number;
  ancVisit?: string;
  diagnosis?: Array<{ kondisiId: string; jumlahKasus: number }>;
  symptoms?: Array<{ gejalaId: string; jumlah: number }>;
  medication?: Array<{ obatId: string; quantity: number }>;
  notes?: string;
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

export async function createPatient(payload: CreatePatientPayload): Promise<{ patient: PatientRecord; pregnancy: PregnancyRecord }> {
  return apiFetch('/patients', { method: 'POST', body: JSON.stringify(payload) });
}

export async function createQueue(payload: { patientId: string; pregnancyId: string }): Promise<QueueRecord> {
  return apiFetch('/queue', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getTodayQueue(params?: { puskesmasId?: string }): Promise<QueueRecord[]> {
  const query = params?.puskesmasId ? `?puskesmasId=${encodeURIComponent(params.puskesmasId)}` : '';
  return apiFetch(`/queue/today${query}`);
}

export async function updateQueueStatus(id: string, status: QueueStatus): Promise<QueueRecord> {
  return apiFetch(`/queue/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function createExamination(payload: CreateExaminationPayload) {
  return apiFetch('/examinations', { method: 'POST', body: JSON.stringify(payload) });
}
