export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api';

export type UserRole = 'BIDAN_PUSKESMAS' | 'IFK_ADMIN' | 'SUPER_ADMIN';

export type CurrentUser = {
  id: string;
  username: string;
  displayName?: string;
  role: UserRole;
  puskesmasId: string | null;
};

export type LoginResponse = {
  user: CurrentUser;
  token: string;
};

export type AdminUserRecord = CurrentUser & {
  active: boolean;
  createdAt: string;
  updatedAt: string;
  puskesmas?: { id: string; nama: string; kecamatan?: string; latitude?: number | null; longitude?: number | null } | null;
};

export type PregnancyRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type QueueStatus = 'WAITING' | 'EXAMINING' | 'COMPLETED' | 'CANCELLED';
export type ExaminationSource = 'MANUAL' | 'VOICE_TRANSCRIPT_FALLBACK' | 'VOICE_TRANSCRIPT_AI';

export type PatientRecord = {
  id: string;
  fullName: string;
  nik: string;
  dateOfBirth?: string | null;
  phone?: string | null;
  address?: string | null;
  bpjsNumber?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  bloodType?: string | null;
  allergy?: string | null;
  chronicHistory?: string | null;
  pregnancies?: PregnancyRecord[];
};

export type PregnancyRecord = {
  id: string;
  lmp?: string | null;
  edd?: string | null;
  gestationalAge?: number | null;
  ancVisit?: string | null;
  gravida?: number | null;
  para?: number | null;
  abortus?: number | null;
  pregnancyType?: string | null;
  visitReason?: string | null;
  chiefComplaint?: string | null;
  emergencySigns?: string[] | null;
  vitalSigns?: Record<string, unknown> | null;
  riskFactors?: string[] | null;
  routineMedication?: string[] | null;
  clinicalNotes?: string | null;
  responsibleDoctor?: string | null;
  priority?: string | null;
  riskLevel: PregnancyRiskLevel;
};

export type DashboardSummary = {
  role: UserRole;
  queue?: { waiting: number; examining: number; completed: number };
  patients?: { total: number };
  medicine?: { criticalCount: number };
  recommendations?: { pending: number; approved: number; rejected: number; critical: number };
  deliveries?: { active: number };
  masterData?: { healthCenters: number; users: number; medicines: number; inactiveAccounts: number };
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
  obat?: ObatRecord;
  puskesmas?: PuskesmasRecord;
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
  puskesmas?: { id: string; nama: string; kecamatan?: string; latitude?: number | null; longitude?: number | null };
  items: RecommendationItem[];
  trackingEvents?: TrackingEvent[];
};

export type CreatePatientPayload = {
  fullName: string;
  nik: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  bpjsNumber?: string;
  emergencyName: string;
  emergencyPhone: string;
  bloodType?: string;
  allergy?: string;
  chronicHistory?: string;
  lmp?: string;
  edd?: string;
  gestationalAge?: number;
  ancVisit?: string;
  gravida?: number;
  para?: number;
  abortus?: number;
  pregnancyType?: string;
  visitReason?: string;
  chiefComplaint?: string;
  emergencySigns?: string[];
  vitalSigns?: Record<string, unknown>;
  riskFactors?: string[];
  routineMedication?: string[];
  clinicalNotes?: string;
  responsibleDoctor?: string;
  priority?: string;
  riskLevel?: PregnancyRiskLevel;
};

export type PuskesmasRecord = {
  id: string;
  nama: string;
  kecamatan: string;
  kabupatenKota?: string | null;
  provinsi?: string | null;
  tipe: string;
  rainyAccess: string;
  coldChainReady: boolean;
  statusEndemisMalaria: boolean;
  ketersediaanLab: boolean;
  kapasitasSimpanObat?: number | null;
  jarakKeIfkKm?: number | null;
  leadTimeHari?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  skorAksesibilitas: number;
};

export type AlertRecord = {
  id: number;
  puskesmasId: string;
  type: string;
  severity: string;
  message: string;
  resolved: boolean;
  createdAt: string;
};

export type ObatRecord = {
  id: string;
  nama: string;
  kategori: string;
  tipe: string;
  perluColdChain: boolean;
  satuan: string;
  dosisStandarHarian?: number | null;
  durasiPengobatanHari?: number | null;
};

export type KondisiRecord = { id: string; nama: string; deskripsi?: string | null };
export type GejalaRecord = { id: string; nama: string; deskripsi?: string | null };

export type KiaExtractionResult = {
  fullName?: string | null;
  nik?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  phone?: string | null;
  bloodType?: string | null;
  lmp?: string | null;
  edd?: string | null;
  gestationalAge?: number | null;
  ancVisit?: string | null;
  gravida?: number | null;
  para?: number | null;
  abortus?: number | null;
  riskFactors?: string[];
  rawText?: string;
  confidence: Record<string, number>;
  needsReview: boolean;
};

export type SpeechTranscriptionResult = {
  transcript: string;
  language: string;
  durationSeconds?: number | null;
  confidence?: number | null;
  segments: Array<{ start: number; end: number; text: string }>;
  draft: {
    complaint: string;
    bloodPressure?: string | null;
    pulse?: string | null;
    gestationalAge?: number | null;
    ancVisit?: string | null;
    symptoms: string[];
    diagnosis?: string | null;
    medicine?: string | null;
    dosage?: string | null;
    unit?: string | null;
    notes?: string | null;
  };
  needsReview: boolean;
};

export type AiMasterSyncResult = {
  puskesmas: number;
  obat: number;
  kondisi: number;
};

export type StokRow = {
  id: number;
  puskesmasId: string;
  obatId: string;
  periode: string;
  stokAwal: number;
  konsumsiPeriode: number;
  stokSaatIni: number;
  obat?: ObatRecord;
  puskesmas?: PuskesmasRecord;
};

export type ForecastRun = {
  id: number;
  puskesmasId: string;
  periode: string;
  status: string;
  confidence: string;
  createdAt: string;
  prediksi?: Array<{
    id: number;
    obatId: string;
    kebutuhanObat: number;
    bufferPersen: number;
    totalRekomendasi: number;
    stokSaatIni: number;
    konsumsiPeriode: number;
  }>;
};

export type AiWorkflowStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'FAILED_PARTIAL';

export type AiWorkflowJob = {
  id: string;
  status: AiWorkflowStatus;
  puskesmasId: string;
  periode: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  errorMessage?: string | null;
  warnings?: string[] | null;
  forecastRunId?: number | null;
  recommendationId?: string | null;
};

export type DemoWorkflowRunResponse = { jobId: string; status: AiWorkflowStatus; puskesmasId: string; periode: string };
export type AiWorkflowRunPayload = { puskesmasId?: string; periode: string };

export type DemoWorkflowState = {
  puskesmasId: string;
  periode: string;
  job?: AiWorkflowJob | null;
  forecastRun?: ForecastRun | null;
  lplpoRows: LplpoRow[];
  recommendation?: DistributionRecommendation | null;
};

export type CreateExaminationPayload = {
  queueId?: string;
  patientId: string;
  pregnancyId: string;
  source?: ExaminationSource;
  complaint?: string;
  vitalSigns?: Record<string, unknown>;
  gestationalAge?: number;
  ancVisit?: string;
  diagnosis?: Array<{ kondisiId: string; jumlahKasus: number }>;
  symptoms?: Array<{ gejalaId: string; jumlah: number }>;
  medication?: Array<{ obatId: string; quantity: number }>;
  notes?: string;
  riskSummary?: Record<string, unknown>;
};

export type ApiReachability = {
  ok: boolean;
  status?: number;
  message: string;
};

export async function checkApiReachability(): Promise<ApiReachability> {
  try {
    const response = await fetch(`${apiBaseUrl}/ai/health`, {
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
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      ...(init.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) throw new Error(await readError(response));
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function login(username: string, password: string): Promise<CurrentUser> {
  const result = await apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
  return result.user;
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

export async function getUsers(): Promise<AdminUserRecord[]> {
  return apiFetch('/auth/users');
}

export async function createPatient(payload: CreatePatientPayload): Promise<{ patient: PatientRecord; pregnancy: PregnancyRecord }> {
  return apiFetch('/patients', { method: 'POST', body: JSON.stringify(payload) });
}

export async function extractKiaBook(file: File): Promise<KiaExtractionResult> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch('/kia/extract', { method: 'POST', body: form });
}

export async function transcribeSpeech(file: Blob): Promise<SpeechTranscriptionResult> {
  const form = new FormData();
  form.append('file', file, 'examination-recording.webm');
  return apiFetch('/speech/transcribe', { method: 'POST', body: form });
}

export async function getPatients(): Promise<PatientRecord[]> {
  return apiFetch('/patients');
}

export async function updatePatient(id: string, payload: Partial<CreatePatientPayload>): Promise<PatientRecord> {
  return apiFetch(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function deletePatient(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch(`/patients/${id}`, { method: 'DELETE' });
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch('/dashboard/summary');
}

export async function getPuskesmas(): Promise<PuskesmasRecord[]> {
  return apiFetch('/master/puskesmas');
}

export async function getObat(): Promise<ObatRecord[]> {
  return apiFetch('/master/obat');
}

export async function getKondisi(): Promise<KondisiRecord[]> {
  return apiFetch('/master/kondisi');
}

export async function getGejala(): Promise<GejalaRecord[]> {
  return apiFetch('/master/gejala');
}

export async function syncAiMasterData(): Promise<AiMasterSyncResult> {
  return apiFetch('/master/ai/sync', { method: 'POST' });
}

export async function deleteObat(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch(`/master/obat/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function getAlerts(): Promise<AlertRecord[]> {
  return apiFetch('/distribution/alerts');
}

export async function getStokRows(params?: { puskesmasId?: string; periode?: string }): Promise<StokRow[]> {
  const query = new URLSearchParams();
  if (params?.puskesmasId) query.set('puskesmasId', params.puskesmasId);
  if (params?.periode) query.set('periode', params.periode);
  const suffix = query.size ? `?${query.toString()}` : '';
  return apiFetch(`/inputs/stok${suffix}`);
}

export async function upsertStok(payload: { puskesmasId: string; obatId: string; periode: string; stokAwal: number; konsumsiPeriode: number; stokSaatIni: number }): Promise<StokRow> {
  return apiFetch('/inputs/stok', { method: 'POST', body: JSON.stringify(payload) });
}

export async function createQueue(payload: { patientId: string; pregnancyId: string; assignedDoctor?: string }): Promise<QueueRecord> {
  return apiFetch('/queue', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getTodayQueue(params?: { puskesmasId?: string }): Promise<QueueRecord[]> {
  const query = params?.puskesmasId ? `?puskesmasId=${encodeURIComponent(params.puskesmasId)}` : '';
  return apiFetch(`/queue/today${query}`);
}

export async function getQueue(params?: { puskesmasId?: string; status?: QueueStatus }): Promise<QueueRecord[]> {
  const query = new URLSearchParams();
  if (params?.puskesmasId) query.set('puskesmasId', params.puskesmasId);
  if (params?.status) query.set('status', params.status);
  const suffix = query.size ? `?${query.toString()}` : '';
  return apiFetch(`/queue${suffix}`);
}

export async function updateQueueStatus(id: string, status: QueueStatus): Promise<QueueRecord> {
  return apiFetch(`/queue/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function deleteQueue(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch(`/queue/${id}`, { method: 'DELETE' });
}

export async function createExamination(payload: CreateExaminationPayload) {
  return apiFetch('/examinations', { method: 'POST', body: JSON.stringify(payload) });
}

export async function runDemoWorkflow(): Promise<DemoWorkflowRunResponse> {
  return apiFetch('/workflow/demo/run', { method: 'POST' });
}

export async function getDemoWorkflowState(): Promise<DemoWorkflowState> {
  return apiFetch('/workflow/demo/state');
}

export async function runAiWorkflow(payload: AiWorkflowRunPayload): Promise<DemoWorkflowRunResponse> {
  return apiFetch('/workflow/ai/run', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getAiWorkflowState(payload: AiWorkflowRunPayload): Promise<DemoWorkflowState> {
  const query = new URLSearchParams({ periode: payload.periode });
  if (payload.puskesmasId) query.set('puskesmasId', payload.puskesmasId);
  return apiFetch(`/workflow/ai/state?${query.toString()}`);
}

export async function getForecastRuns(): Promise<ForecastRun[]> {
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
