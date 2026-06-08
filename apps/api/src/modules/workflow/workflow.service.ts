import { Injectable } from '@nestjs/common';
import { RecommendationStatus } from '@prisma/client';
import type { CurrentUser } from '../../common/auth/current-user';
import { ForecastService } from '../forecast/forecast.service';
import { LplpoService } from '../lplpo/lplpo.service';
import { PrismaService } from '../../prisma/prisma.service';

const DEMO_PUSKESMAS_ID = 'PKM-001';
const DEMO_PERIODE = '2026-06-01';
const DEMO_PERIODE_DATE = new Date(`${DEMO_PERIODE}T00:00:00.000Z`);

@Injectable()
export class WorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly forecast: ForecastService,
    private readonly lplpo: LplpoService,
  ) {}

  async runDemo(user: CurrentUser) {
    await this.ensureDemoInputs();
    const forecastRun = await this.forecast.run({ puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE });
    const lplpoRows = await this.lplpo.generate({ puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE });

    const totalRequested = lplpoRows.reduce((sum, row) => sum + row.jumlahDiminta, 0);
    const recommendation = await this.prisma.distributionRecommendation.upsert({
      where: { id: 'REC-DEMO-001' },
      update: {
        puskesmasId: DEMO_PUSKESMAS_ID,
        periode: DEMO_PERIODE_DATE,
        status: RecommendationStatus.PENDING,
        urgency: totalRequested > 20 ? 'CRITICAL' : 'WARNING',
        source: 'RULE_BASED_FALLBACK',
        priorityRank: 1,
        justification: `Demo workflow generated ${totalRequested} requested medicine units from forecast and LPLPO.`,
        routeSummary: { marker: 'workflow.demo.run', recalculatedAt: DEMO_PERIODE, route: 'IFK Sleman - PKM-001' },
        createdFromForecastRunId: forecastRun.id,
      },
      create: {
        id: 'REC-DEMO-001',
        puskesmasId: DEMO_PUSKESMAS_ID,
        periode: DEMO_PERIODE_DATE,
        status: RecommendationStatus.PENDING,
        urgency: totalRequested > 20 ? 'CRITICAL' : 'WARNING',
        source: 'RULE_BASED_FALLBACK',
        priorityRank: 1,
        justification: `Demo workflow generated ${totalRequested} requested medicine units from forecast and LPLPO.`,
        routeSummary: { marker: 'workflow.demo.run', recalculatedAt: DEMO_PERIODE, route: 'IFK Sleman - PKM-001' },
        createdFromForecastRunId: forecastRun.id,
      },
    });

    const itemRows = [];
    for (const row of lplpoRows) {
      const itemId = row.obatId === 'OBT-010' ? 'RECITEM-DEMO-001' : `RECITEM-DEMO-${row.obatId}`;
      itemRows.push(
        await this.prisma.distributionRecommendationItem.upsert({
          where: { id: itemId },
          update: {
            recommendationId: recommendation.id,
            aiQuantity: row.jumlahDiminta,
            finalQuantity: row.jumlahDiminta,
            overrideQuantity: null,
            overrideReason: null,
          },
          create: {
            id: `RECITEM-DEMO-${row.obatId}`,
            recommendationId: recommendation.id,
            obatId: row.obatId,
            aiQuantity: row.jumlahDiminta,
            finalQuantity: row.jumlahDiminta,
          },
        }),
      );
    }

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'workflow.demo.run',
        entityType: 'DistributionRecommendation',
        entityId: recommendation.id,
        metadata: { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE, forecastRunId: forecastRun.id, lplpoRows: lplpoRows.length },
      },
    });

    return { forecastRun, lplpoRows, recommendation: { ...recommendation, items: itemRows } };
  }

  async getDemoState() {
    const [forecastRun, lplpoRows, recommendation] = await Promise.all([
      this.prisma.forecastRun.findFirst({
        where: { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE },
        include: { prediksi: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lplpoPrediktif.findMany({ where: { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE_DATE }, orderBy: { id: 'asc' } }),
      this.prisma.distributionRecommendation.findUnique({
        where: { id: 'REC-DEMO-001' },
        include: { items: { include: { obat: true } }, trackingEvents: { orderBy: { createdAt: 'desc' } } },
      }),
    ]);

    return { puskesmasId: DEMO_PUSKESMAS_ID, periode: DEMO_PERIODE, forecastRun, lplpoRows, recommendation };
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
  }
}
