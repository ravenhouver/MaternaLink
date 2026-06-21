import { Injectable, Logger } from '@nestjs/common';

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
  private readonly logger = new Logger(AiService.name);

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
    if (this.mode() !== 'remote') return Promise.resolve(this.fallbackExtractSymptoms(payload));

    return this.request<AiExtractResponse>('/api/v1/layer0/extract', { method: 'POST', body: JSON.stringify(payload) }).catch((error) => {
      this.logger.warn(`AI extraction unavailable, using local fallback: ${this.errorMessage(error)}`);
      return this.fallbackExtractSymptoms(payload);
    });
  }

  async forecastDemand(payload: AiForecastRequest): Promise<AiForecastResponse> {
    if (this.mode() !== 'remote') return this.fallbackForecastDemand(payload);

    try {
      return await this.request('/api/v1/layer1/forecast', { method: 'POST', body: JSON.stringify(payload) });
    } catch (error) {
      this.logger.warn(`AI forecast unavailable, using local fallback: ${this.errorMessage(error)}`);
      return this.fallbackForecastDemand(payload);
    }
  }

  allocate(payload: AiAllocateRequest): Promise<AiAllocateResponse> {
    if (this.mode() !== 'remote') return Promise.resolve(this.fallbackAllocate(payload));

    return this.request<AiAllocateResponse>('/api/v1/layer2/allocate', { method: 'POST', body: JSON.stringify(payload) }, 'layer2').catch((error) => {
      this.logger.warn(`AI allocation unavailable, using local fallback: ${this.errorMessage(error)}`);
      return this.fallbackAllocate(payload);
    });
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

  private mode() {
    return process.env.AI_MODE ?? 'remote';
  }

  private fallbackForecastDemand(payload: AiForecastRequest): AiForecastResponse {
    const treatmentDemand = payload.estimated_total_cases * payload.standard_daily_dose * payload.treatment_duration_days;
    const leadTimeDemand = (treatmentDemand / 30) * Math.max(0, payload.lead_time_days);
    const accessBuffer = Math.max(0, Math.min(1, 1 - payload.accessibility_score)) * 0.2;
    const rainyBuffer = payload.rainy_season_access === 'cut_off' ? 0.2 : payload.rainy_season_access === 'limited' ? 0.1 : 0;
    const buffer_pct = Number((0.15 + accessBuffer + rainyBuffer).toFixed(2));
    const forecast_demand = Math.max(1, Math.ceil(treatmentDemand + leadTimeDemand));
    const buffer_units = Math.ceil(forecast_demand * buffer_pct);

    return {
      facility_id: payload.facility_id,
      drug_id: payload.drug_id,
      period: payload.period,
      forecast_demand,
      buffer_pct,
      buffer_units,
      total_requirement: forecast_demand + buffer_units,
      current_stock: payload.closing_stock,
    };
  }

  private fallbackExtractSymptoms(payload: AiExtractRequest): AiExtractResponse {
    return {
      extraction_results: payload.records.map((record) => ({
        record_id: record.record_id,
        facility_id: record.facility_id,
        period: payload.period,
        extracted_symptoms: '[]',
        min_confidence: 0,
        hitl_flag: true,
        validated_symptoms: '[]',
        extraction_model: 'local-fallback',
      })),
      condition_estimates: [],
    };
  }

  private fallbackAllocate(payload: AiAllocateRequest): AiAllocateResponse {
    const remainingByDrug = new Map(payload.ifk_stock.map((item) => [item.drug_id, Math.max(0, Math.round(item.available_units))]));
    const stockouts = new Map((payload.stockout_history ?? []).map((item) => [`${item.facility_id}:${item.drug_id}`, item.stockouts_6m]));
    const rows = [...payload.l1_forecasts].sort((a, b) => {
      const aNeed = Math.max(0, a.total_requirement - a.current_stock);
      const bNeed = Math.max(0, b.total_requirement - b.current_stock);
      const aScore = aNeed + (stockouts.get(`${a.facility_id}:${a.drug_id}`) ?? 0) * 10;
      const bScore = bNeed + (stockouts.get(`${b.facility_id}:${b.drug_id}`) ?? 0) * 10;
      return bScore - aScore;
    });

    const allocations = rows.map((row) => {
      const requirement = Math.max(0, Math.round(row.total_requirement));
      const available = remainingByDrug.get(row.drug_id) ?? 0;
      const allocated = Math.min(requirement, available);
      remainingByDrug.set(row.drug_id, available - allocated);
      const unmet = Math.max(0, requirement - allocated);
      const coverage_ratio = requirement === 0 ? 1 : Number((allocated / requirement).toFixed(3));
      const stockoutCount = stockouts.get(`${row.facility_id}:${row.drug_id}`) ?? 0;
      const priority_score = Math.round((unmet * 2) + Math.max(0, row.forecast_demand - row.current_stock) + stockoutCount * 10);

      return {
        facility_id: row.facility_id,
        facility_name: row.facility_id,
        drug_id: row.drug_id,
        drug_name: row.drug_id,
        category: 'fallback',
        requirement,
        allocated,
        coverage_ratio,
        unmet,
        priority_score,
        factors: [
          { factor: 'requirement', value: String(requirement), contribution: requirement },
          { factor: 'current_stock', value: String(row.current_stock), contribution: Math.max(0, row.forecast_demand - row.current_stock) },
          { factor: 'stockout_history_6m', value: String(stockoutCount), contribution: stockoutCount * 10 },
        ],
        justification: unmet > 0
          ? `Local fallback allocated ${allocated} of ${requirement}; ${unmet} units unmet.`
          : `Local fallback allocated ${allocated} units.`
      };
    });

    return {
      run_id: payload.run_id ?? `LOCAL-L2-${Date.now()}`,
      forecast_period: rows[0]?.forecast_period ?? new Date().toISOString().slice(0, 10),
      summary: {
        mode: 'local-fallback',
        total_requirement: allocations.reduce((sum, item) => sum + item.requirement, 0),
        total_allocated: allocations.reduce((sum, item) => sum + item.allocated, 0),
        total_unmet: allocations.reduce((sum, item) => sum + item.unmet, 0),
      },
      allocations,
      redistribution: [],
    };
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

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'unknown error';
  }
}
