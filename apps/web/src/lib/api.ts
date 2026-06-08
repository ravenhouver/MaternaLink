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

export type RecommendationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPATCHED' | 'RECEIVED' | 'CANCELLED';
export type RecommendationUrgency = 'ROUTINE' | 'WARNING' | 'CRITICAL';
export type TrackingStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'DISPATCHED' | 'RECEIVED' | 'ISSUE_REPORTED';

export type LplpoRow = {
  id: number;
  puskesmasId: string;
  obatId: string;
  periode: string;
  jumlahDiminta: number;
  daysOfStock?: number | null;
};

export type RecommendationItem = {
  id: string;
  obatId: string;
  aiQuantity: number;
  overrideQuantity?: number | null;
  finalQuantity: number;
  overrideReason?: string | null;
  obat?: { id: string; nama: string; satuan: string };
};

export type TrackingEvent = {
  id: string;
  status: TrackingStatus;
  note?: string | null;
  createdAt: string;
  actor?: { username: string } | null;
};

export type DistributionRecommendation = {
  id: string;
  puskesmasId: string;
  periode: string;
  urgency: RecommendationUrgency;
  status: RecommendationStatus;
  source: string;
  priorityRank: number;
  justification?: string | null;
  routeSummary?: Record<string, unknown> | null;
  puskesmas?: { id: string; nama: string; kecamatan?: string };
  items: RecommendationItem[];
  trackingEvents?: TrackingEvent[];
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

export async function runDemoWorkflow() {
  return apiFetch('/workflow/demo/run', { method: 'POST' });
}

export async function getDemoWorkflowState() {
  return apiFetch('/workflow/demo/state');
}

export async function getForecastRuns() {
  return apiFetch('/forecast/runs');
}

export async function getLplpoRows(params?: { puskesmasId?: string; periode?: string }): Promise<LplpoRow[]> {
  const query = new URLSearchParams();
  if (params?.puskesmasId) query.set('puskesmasId', params.puskesmasId);
  if (params?.periode) query.set('periode', params.periode);
  const suffix = query.size ? `?${query.toString()}` : '';
  return apiFetch(`/lplpo${suffix}`);
}

export async function getRecommendations(filters?: { status?: RecommendationStatus; puskesmasId?: string }): Promise<DistributionRecommendation[]> {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status);
  if (filters?.puskesmasId) query.set('puskesmasId', filters.puskesmasId);
  const suffix = query.size ? `?${query.toString()}` : '';
  return apiFetch(`/distribution/recommendations${suffix}`);
}

export async function updateRecommendationItem(recommendationId: string, itemId: string, payload: { overrideQuantity?: number; overrideReason?: string }) {
  return apiFetch(`/distribution/recommendations/${recommendationId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function reorderRecommendations(orderedIds: string[]): Promise<DistributionRecommendation[]> {
  return apiFetch('/distribution/recommendations/reorder', { method: 'PATCH', body: JSON.stringify({ orderedIds }) });
}

export async function approveRecommendation(id: string): Promise<DistributionRecommendation> {
  return apiFetch(`/distribution/recommendations/${id}/approve`, { method: 'PATCH' });
}

export async function rejectRecommendation(id: string, note: string): Promise<DistributionRecommendation> {
  return apiFetch(`/distribution/recommendations/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ note }) });
}

export async function getRecommendationTracking(id: string): Promise<TrackingEvent[]> {
  return apiFetch(`/distribution/recommendations/${id}/tracking`);
}

export async function addTrackingEvent(id: string, payload: { status: TrackingStatus; note?: string }) {
  return apiFetch(`/distribution/recommendations/${id}/tracking/events`, { method: 'POST', body: JSON.stringify(payload) });
}
