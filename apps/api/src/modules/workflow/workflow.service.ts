import { Injectable } from '@nestjs/common';
import { AiWorkflowStatus, Prisma, RecommendationStatus } from '@prisma/client';
import type { CurrentUser } from '../../common/auth/current-user';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService, type AiAllocateRequest, type AiExtractResponse, type AiForecastResponse } from '../ai/ai.service';
import { LplpoService } from '../lplpo/lplpo.service';

const DEMO_PUSKESMAS_ID = 'PKM-001';
const DEMO_PERIODE = '2026-06-01';
const DEMO_PERIODE_DATE = new Date(`${DEMO_PERIODE}T00:00:00.000Z`);
const DEMO_RECOMMENDATION_ID = 'REC-DEMO-001';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly lplpo: LplpoService,
  ) {}

  async runDemo(user: CurrentUser) {
    await this.ensureDemoInputs();
    const job = await this.prisma.aiWorkflowJob.create({
      data: { kind: 'DEMO_AI_WORKFLOW', status: AiWorkflowStatus.PENDING, puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE },
    });

    void this.processDemoJob(job.id, user.id).catch(() => undefined);

    return { jobId: job.id, status: job.status, puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE };
  }

  async getDemoState() {
    const [job, forecastRun, lplpoRows, recommendation] = await Promise.all([
      this.prisma.aiWorkflowJob.findFirst({
        where: { kind: 'DEMO_AI_WORKFLOW', puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.forecastRun.findFirst({
        where: { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE },
        include: { prediksi: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lplpoPrediktif.findMany({ where: { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE }, orderBy: { id: 'asc' } }),
      this.prisma.distributionRecommendation.findUnique({
        where: { id: DEMO_RECOMMENDATION_ID },
        include: { items: { include: { obat: true } }, trackingEvents: { orderBy: { createdAt: 'desc' } } },
      }),
    ]);

    return { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE, job, forecastRun, lplpoRows, recommendation };
  }

  private async processDemoJob(jobId: string, userId?: string | null) {
    const warnings: string[] = [];
    await this.prisma.aiWorkflowJob.update({ where: { id: jobId }, data: { status: AiWorkflowStatus.RUNNING, startedAt: new Date() } });

    try {
      const source = await this.loadDemoSourceData();
      const extraction = await this.extractLayer0(source, warnings);
      const forecastRun = await this.persistLayer1Forecasts(source, extraction, warnings);
      const lplpoRows = await this.lplpo.generate({ puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE });

      try {
        const recommendation = await this.persistLayer2Recommendation(forecastRun.id, source, lplpoRows);
        await this.prisma.aiWorkflowJob.update({
          where: { id: jobId },
          data: {
            status: AiWorkflowStatus.COMPLETED,
            finishedAt: new Date(),
            warnings: warnings as Prisma.InputJsonValue,
            forecastRunId: forecastRun.id,
            recommendationId: recommendation.id,
            errorMessage: null,
          },
        });
        await this.prisma.auditLog.create({
          data: {
            userId,
            action: 'workflow.demo.ai.completed',
            entityType: 'AiWorkflowJob',
            entityId: jobId,
            metadata: { forecastRunId: forecastRun.id, recommendationId: recommendation.id },
          },
        });
      } catch (error) {
        await this.prisma.aiWorkflowJob.update({
          where: { id: jobId },
          data: {
            status: AiWorkflowStatus.FAILED_PARTIAL,
            finishedAt: new Date(),
            warnings: warnings as Prisma.InputJsonValue,
            forecastRunId: forecastRun.id,
            errorMessage: this.errorMessage(error),
          },
        });
      }
    } catch (error) {
      await this.prisma.aiWorkflowJob.update({
        where: { id: jobId },
        data: { status: AiWorkflowStatus.FAILED, finishedAt: new Date(), warnings: warnings as Prisma.InputJsonValue, errorMessage: this.errorMessage(error) },
      });
    }
  }

  private async loadDemoSourceData() {
    const [puskesmas, stocks, context, diagnoses, anamnesis] = await Promise.all([
      this.prisma.puskesmas.findUniqueOrThrow({ where: { id: DEMO_PUSKESMAS_ID } }),
      this.prisma.stokPuskesmas.findMany({
        where: { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE },
        include: { obat: { include: { kondisiObat: true } } },
        orderBy: { obatId: 'asc' },
      }),
      this.prisma.konteksPeriode.findUnique({ where: { puskesmasId_periode: { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE } } }),
      this.prisma.diagnosisPeriode.findMany({ where: { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE } }),
      this.prisma.anamnesisRaw.findMany({ where: { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE }, orderBy: { createdAt: 'asc' } }),
    ]);
    return { puskesmas, stocks, context, diagnoses, anamnesis };
  }

  private async extractLayer0(source: Awaited<ReturnType<typeof this.loadDemoSourceData>>, warnings: string[]): Promise<AiExtractResponse | null> {
    if (!source.anamnesis.length && !source.diagnoses.length) return null;
    try {
      return await this.ai.extractSymptoms({
        period: DEMO_PERIODE,
        records: source.anamnesis.map((row) => ({ record_id: `ANM-${row.id}`, facility_id: row.puskesmasId, transcript: row.transkrip, has_lab: source.puskesmas.ketersediaanLab })),
        manual_diagnoses: source.diagnoses.map((row) => ({ facility_id: row.puskesmasId, condition_id: row.kondisiId, case_count: row.jumlahKasus })),
      });
    } catch (error) {
      warnings.push(`Layer 0 fallback: ${this.errorMessage(error)}`);
      return null;
    }
  }

  private async persistLayer1Forecasts(source: Awaited<ReturnType<typeof this.loadDemoSourceData>>, extraction: AiExtractResponse | null, warnings: string[]) {
    const successful: Array<{ stock: (typeof source.stocks)[number]; forecast: AiForecastResponse }> = [];

    for (const stock of source.stocks) {
      try {
        const forecast = await this.ai.forecastDemand({
          facility_id: stock.puskesmasId,
          drug_id: stock.obatId,
          period: DEMO_PERIODE,
          closing_stock: stock.stokSaatIni,
          estimated_total_cases: this.estimatedCasesFor(stock, source, extraction),
          lead_time_days: source.puskesmas.leadTimeHari ?? 3,
          rainy_season_access: this.rainyAccessForAi(source.context?.rainyAccess ?? source.puskesmas.rainyAccess),
          accessibility_score: this.accessibilityScoreForAi(source),
          standard_daily_dose: stock.obat.dosisStandarHarian ?? 1,
          treatment_duration_days: stock.obat.durasiPengobatanHari ?? 1,
        });
        successful.push({ stock, forecast });
      } catch (error) {
        warnings.push(`Layer 1 ${stock.obatId} failed: ${this.errorMessage(error)}`);
      }
    }

    if (!successful.length) throw new Error('Layer 1 failed for all stock rows');

    return this.prisma.forecastRun.create({
      data: {
        puskesmasId: DEMO_PUSKESMAS_ID,
        periode: DEMO_PERIODE_DATE,
        status: 'COMPLETED',
        confidence: warnings.length ? 'MEDIUM' : 'HIGH',
        prediksi: {
          create: successful.map(({ stock, forecast }) => ({
            obatId: stock.obatId,
            kondisiId: stock.obat.kondisiObat[0]?.kondisiId,
            kebutuhanObat: Math.max(0, Math.round(forecast.forecast_demand)),
            bufferPersen: forecast.buffer_pct,
            totalRekomendasi: Math.max(0, Math.round(forecast.total_requirement)),
            stokSaatIni: Math.max(0, Math.round(forecast.current_stock)),
            konsumsiPeriode: stock.konsumsiPeriode,
            confidence: 'HIGH',
          })),
        },
      },
      include: { prediksi: { orderBy: { obatId: 'asc' } } },
    });
  }

  private async persistLayer2Recommendation(forecastRunId: number, source: Awaited<ReturnType<typeof this.loadDemoSourceData>>, lplpoRows: Awaited<ReturnType<LplpoService['generate']>>) {
    const run = await this.prisma.forecastRun.findUniqueOrThrow({ where: { id: forecastRunId }, include: { prediksi: true } });
    const request: AiAllocateRequest = {
      run_id: DEMO_RECOMMENDATION_ID,
      l1_forecasts: run.prediksi.map((row) => ({
        facility_id: run.puskesmasId,
        drug_id: row.obatId,
        forecast_demand: row.kebutuhanObat,
        current_stock: row.stokSaatIni,
        total_requirement: row.totalRekomendasi,
        forecast_period: DEMO_PERIODE,
      })),
      ifk_stock: run.prediksi.map((row) => ({ drug_id: row.obatId, available_units: Math.max(row.totalRekomendasi, row.stokSaatIni) })),
      stockout_history: this.stockoutHistory(source),
    };

    const allocation = await this.ai.allocate(request);
    const totalAllocated = allocation.allocations.reduce((sum, item) => sum + item.allocated, 0);
    const maxUnmet = allocation.allocations.reduce((max, item) => Math.max(max, item.unmet), 0);
    const firstJustification = allocation.allocations.find((item) => item.justification)?.justification;

    return this.prisma.$transaction(async (tx) => {
      await tx.distributionRecommendationItem.deleteMany({ where: { recommendationId: DEMO_RECOMMENDATION_ID } });
      const recommendation = await tx.distributionRecommendation.upsert({
        where: { id: DEMO_RECOMMENDATION_ID },
        update: {
          puskesmasId: DEMO_PUSKESMAS_ID,
          periode: DEMO_PERIODE_DATE,
          status: RecommendationStatus.PENDING,
          urgency: maxUnmet > 0 ? 'CRITICAL' : 'WARNING',
          source: 'HF_AI_LAYER2',
          priorityRank: 1,
          justification: firstJustification ?? `Hosted AI allocated ${totalAllocated} units.`,
          routeSummary: allocation.summary as Prisma.InputJsonValue,
          createdFromForecastRunId: forecastRunId,
        },
        create: {
          id: DEMO_RECOMMENDATION_ID,
          puskesmasId: DEMO_PUSKESMAS_ID,
          periode: DEMO_PERIODE_DATE,
          status: RecommendationStatus.PENDING,
          urgency: maxUnmet > 0 ? 'CRITICAL' : 'WARNING',
          source: 'HF_AI_LAYER2',
          priorityRank: 1,
          justification: firstJustification ?? `Hosted AI allocated ${totalAllocated} units.`,
          routeSummary: allocation.summary as Prisma.InputJsonValue,
          createdFromForecastRunId: forecastRunId,
        },
      });

      const allocationsByDrug = new Map(allocation.allocations.map((item) => [item.drug_id, item]));
      for (const row of lplpoRows) {
        const allocated = allocationsByDrug.get(row.obatId)?.allocated ?? row.jumlahDiminta;
        await tx.distributionRecommendationItem.create({
          data: {
            id: row.obatId === 'OBT-010' ? 'RECITEM-DEMO-001' : `RECITEM-DEMO-${row.obatId}`,
            recommendationId: recommendation.id,
            obatId: row.obatId,
            aiQuantity: Math.max(0, Math.round(allocated)),
            finalQuantity: Math.max(0, Math.round(allocated)),
          },
        });
      }
      return recommendation;
    });
  }

  private estimatedCasesFor(stock: Awaited<ReturnType<typeof this.loadDemoSourceData>>['stocks'][number], source: Awaited<ReturnType<typeof this.loadDemoSourceData>>, extraction: AiExtractResponse | null) {
    const conditionId = stock.obat.kondisiObat[0]?.kondisiId;
    const estimate = extraction?.condition_estimates.find((item) => item.condition_id === conditionId);
    if (estimate) return Math.max(0, estimate.estimated_total_cases);
    const diagnosis = source.diagnoses.find((item) => item.kondisiId === conditionId);
    return Math.max(1, diagnosis?.jumlahKasus ?? Math.ceil(stock.konsumsiPeriode / 10));
  }

  private rainyAccessForAi(value?: string | null) {
    if (value === 'TERGANGGU') return 'cut_off';
    if (value === 'TERBATAS') return 'limited';
    return 'normal';
  }

  private accessibilityScoreForAi(source: Awaited<ReturnType<typeof this.loadDemoSourceData>>) {
    const raw = source.context?.accessScore ?? source.puskesmas.skorAksesibilitas ?? 2;
    return Math.max(0, Math.min(1, raw / 3));
  }

  private stockoutHistory(source: Awaited<ReturnType<typeof this.loadDemoSourceData>>) {
    const raw = source.context?.riwayatStockout6Bln;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    return Object.entries(raw as Record<string, unknown>).map(([drug_id, value]) => ({ facility_id: DEMO_PUSKESMAS_ID, drug_id, stockouts_6m: Number(value) || 0 }));
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'AI workflow failed';
  }

  private async ensureDemoInputs() {
    await this.prisma.stokPuskesmas.upsert({
      where: { puskesmasId_obatId_periode: { puskesmasId: DEMO_PUSKESMAS_ID, obatId: 'OBT-010', periode: DEMO_PERIODE_DATE } },
      update: { stokAwal: 20, konsumsiPeriode: 18, stokSaatIni: 2 },
      create: { puskesmasId: DEMO_PUSKESMAS_ID, obatId: 'OBT-010', periode: DEMO_PERIODE_DATE, stokAwal: 20, konsumsiPeriode: 18, stokSaatIni: 2 },
    });
    await this.prisma.konteksPeriode.upsert({
      where: { puskesmasId_periode: { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE } },
      update: { season: 'PANCAROBA', accessScore: 2, rainyAccess: 'TERBATAS', routeDisrupted: false, jumlahBumilT1: 18, jumlahBumilT2: 24, jumlahBumilT3: 20, statusKlb: false, riwayatStockout6Bln: { 'OBT-010': 1 } },
      create: { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE, season: 'PANCAROBA', accessScore: 2, rainyAccess: 'TERBATAS', routeDisrupted: false, jumlahBumilT1: 18, jumlahBumilT2: 24, jumlahBumilT3: 20, statusKlb: false, riwayatStockout6Bln: { 'OBT-010': 1 } },
    });
    await this.prisma.diagnosisPeriode.upsert({
      where: { puskesmasId_kondisiId_periode: { puskesmasId: DEMO_PUSKESMAS_ID, kondisiId: 'K03', periode: DEMO_PERIODE_DATE } },
      update: { jumlahKasus: 1, source: 'SISTEM' },
      create: { puskesmasId: DEMO_PUSKESMAS_ID, kondisiId: 'K03', periode: DEMO_PERIODE_DATE, jumlahKasus: 1, source: 'SISTEM' },
    });
    const existingAnamnesis = await this.prisma.anamnesisRaw.findFirst({
      where: { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE, transkrip: 'Demo patient reports headache and swollen feet during ANC visit.' },
    });
    if (!existingAnamnesis) {
      await this.prisma.anamnesisRaw.create({
        data: { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE, transkrip: 'Demo patient reports headache and swollen feet during ANC visit.', extractionModel: 'hosted-ai-workflow-seed' },
      });
    }
  }
}
