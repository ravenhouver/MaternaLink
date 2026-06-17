import { Injectable } from '@nestjs/common';

type RemoteHealth = {
  service?: string;
  version?: string;
  status?: string;
};

export type AiExtractRequest = {
  period: string;
  records: Array<{ record_id: string; facility_id: string; transcript: string; has_lab?: boolean | null }>;
  manual_diagnoses?: Array<{ facility_id: string; condition_id: string; case_count: number }> | null;
};

export type AiExtractResponse = {
  extraction_results: Array<{
    record_id: string;
    facility_id: string;
    period: string;
    extracted_symptoms: string;
    min_confidence: number;
    hitl_flag: boolean;
    validated_symptoms: string;
    extraction_model: string;
  }>;
  condition_estimates: Array<{
    facility_id: string;
    period: string;
    condition_id: string;
    manual_cases: number;
    anamnesis_indicated_cases: number;
    estimated_total_cases: number;
    confidence_level: string;
  }>;
};

export type AiForecastRequest = {
  facility_id: string;
  drug_id: string;
  period: string;
  closing_stock: number;
  estimated_total_cases: number;
  lead_time_days: number;
  rainy_season_access: string;
  accessibility_score: number;
  standard_daily_dose: number;
  treatment_duration_days: number;
};

export type AiForecastResponse = {
  facility_id: string;
  drug_id: string;
  period: string;
  forecast_demand: number;
  buffer_pct: number;
  buffer_units: number;
  total_requirement: number;
  current_stock: number;
};

export type AiAllocateRequest = {
  run_id?: string | null;
  l1_forecasts: Array<{ facility_id: string; drug_id: string; forecast_demand: number; current_stock: number; total_requirement: number; forecast_period: string }>;
  ifk_stock: Array<{ drug_id: string; available_units: number }>;
  stockout_history?: Array<{ facility_id: string; drug_id: string; stockouts_6m: number }> | null;
};

export type AiAllocateResponse = {
  run_id: string;
  forecast_period: string;
  summary: Record<string, unknown>;
  allocations: Array<{
    facility_id: string;
    facility_name: string;
    drug_id: string;
    drug_name: string;
    category: string;
    requirement: number;
    allocated: number;
    coverage_ratio: number;
    unmet: number;
    priority_score: number;
    factors: Array<{ factor: string; value: string; contribution: number }>;
    justification?: string | null;
  }>;
  redistribution: Array<Record<string, unknown>>;
};

export type AiFacility = {
  facility_id: string;
  name: string;
  district: string;
  province?: string | null;
  remoteness?: string | null;
  accessibility_score?: number | null;
  has_cold_chain?: boolean | null;
  has_lab?: boolean | null;
  lead_time_days?: number | null;
  regional_mmr?: number | null;
  baseline_pregnancy_count?: number | null;
};

export type AiDrug = {
  drug_id: string;
  drug_name: string;
  category?: string | null;
  unit: string;
  requires_cold_chain?: boolean | null;
  standard_daily_dose?: number | null;
  treatment_duration_days?: number | null;
};

export type AiCondition = {
  condition_id: string;
  condition_name: string;
  prior_prevalence?: number | null;
};

@Injectable()
export class AiService {
  async getHealth() {
    const mode = process.env.AI_MODE ?? 'remote';
    if (mode !== 'remote') {
      return { mode: 'fallback', remote: false, status: 'fallback-ready' };
    }

    try {
      const remote = await this.request<RemoteHealth>('/health', { method: 'GET' });
      return { mode, remote: true, status: remote.status ?? 'unknown', service: remote.service, version: remote.version };
    } catch {
      return { mode, remote: true, status: 'unavailable' };
    }
  }

  extractSymptoms(payload: AiExtractRequest): Promise<AiExtractResponse> {
    return this.request('/api/v1/layer0/extract', { method: 'POST', body: JSON.stringify(payload) });
  }

  forecastDemand(payload: AiForecastRequest): Promise<AiForecastResponse> {
    return this.request('/api/v1/layer1/forecast', { method: 'POST', body: JSON.stringify(payload) });
  }

  allocate(payload: AiAllocateRequest): Promise<AiAllocateResponse> {
    return this.request('/api/v1/layer2/allocate', { method: 'POST', body: JSON.stringify(payload) }, 'layer2');
  }

  listFacilities(): Promise<AiFacility[]> {
    return this.request('/api/v1/data/facilities', { method: 'GET' });
  }

  listDrugs(): Promise<AiDrug[]> {
    return this.request('/api/v1/data/drugs', { method: 'GET' });
  }

  listConditions(): Promise<AiCondition[]> {
    return this.request('/api/v1/data/conditions', { method: 'GET' });
  }

  private baseUrl() {
    return (process.env.AI_SERVICE_BASE_URL ?? 'https://azrilfahmiardi-maternalink-ai.hf.space').replace(/\/$/, '');
  }

  private timeoutMs(kind: 'default' | 'layer2' = 'default') {
    return Number(kind === 'layer2' ? process.env.AI_LAYER2_TIMEOUT_MS ?? '600000' : process.env.AI_SERVICE_TIMEOUT_MS ?? '30000');
  }

  private async request<T>(path: string, init: RequestInit, timeoutKind: 'default' | 'layer2' = 'default'): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs(timeoutKind));

    try {
      const response = await fetch(`${this.baseUrl()}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      });
      if (!response.ok) throw new Error(`AI service returned HTTP ${response.status}`);
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
