import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RecommendationSource, RecommendationStatus, TrackingStatus, UserRole } from '@prisma/client';
import type { CurrentUser } from '../../common/auth/current-user';
import { assertOwnPuskesmas, requiredScopedPuskesmasId, scopedPuskesmasId } from '../../common/auth/scope-utils';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService, type AiAllocateRequest } from '../ai/ai.service';
import {
  CreateAllocationPlanDto,
  CreateShipmentRequestDto,
  ListRecommendationsQueryDto,
  RunAiAllocationDto,
  TrackingEventDto,
  UpdateAllocationPlanDto,
  UpdateRecommendationItemDto,
} from './distribution.dto';

const toDate = (value: string) => new Date(value);

type LiveWeather = {
  source: 'OPEN_METEO';
  temperatureC?: number | null;
  humidityPct?: number | null;
  precipitationMm?: number | null;
  rainMm?: number | null;
  windKph?: number | null;
  weatherCode?: number | null;
  maxPrecipitationProbabilityPct: number;
  maxDailyPrecipitationMm: number;
  bars: Array<'low' | 'medium' | 'high' | 'critical'>;
  fetchedAt: string;
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    rain?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  hourly?: {
    time?: string[];
    precipitation_probability?: number[];
    precipitation?: number[];
    rain?: number[];
  };
};

@Injectable()
export class DistributionService {
  constructor(private readonly prisma: PrismaService, private readonly ai: AiService) {}

  listRecommendations(filters: ListRecommendationsQueryDto = {}, user?: CurrentUser) {
    const puskesmasId = user ? scopedPuskesmasId(user, filters.puskesmasId) : filters.puskesmasId;
    return this.prisma.distributionRecommendation.findMany({
      where: {
        status: filters.status,
        puskesmasId,
      },
      include: {
        puskesmas: true,
        items: { include: { obat: true }, orderBy: { obatId: 'asc' } },
        trackingEvents: { include: { actor: true }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: [{ priorityRank: 'asc' }, { createdAt: 'desc' }],
    });
  }

  getRecommendation(id: string, user?: CurrentUser) {
    return this.prisma.distributionRecommendation.findFirstOrThrow({
      where: { id, ...(user?.role === UserRole.BIDAN_PUSKESMAS ? { puskesmasId: user.puskesmasId ?? undefined } : {}) },
      include: {
        puskesmas: true,
        items: { include: { obat: true }, orderBy: { obatId: 'asc' } },
        trackingEvents: { include: { actor: true }, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async updateRecommendationItem(recommendationId: string, itemId: string, data: UpdateRecommendationItemDto) {
    const item = await this.prisma.distributionRecommendationItem.findFirst({ where: { id: itemId, recommendationId } });
    if (!item) throw new NotFoundException('Recommendation item not found');

    const hasOverride = data.overrideQuantity !== undefined && data.overrideQuantity !== item.aiQuantity;
    const reason = data.overrideReason?.trim();
    if (hasOverride && !reason) throw new BadRequestException('Override reason is required when changing AI quantity');

    const overrideQuantity = data.overrideQuantity ?? null;
    const finalQuantity = overrideQuantity ?? item.aiQuantity;

    return this.prisma.distributionRecommendationItem.update({
      where: { id: itemId },
      data: {
        overrideQuantity,
        overrideReason: hasOverride ? reason : null,
        finalQuantity,
      },
      include: { obat: true },
    });
  }

  async reorderRecommendations(orderedIds: string[]) {
    if (!orderedIds.length) throw new BadRequestException('orderedIds must contain at least one recommendation');
    if (new Set(orderedIds).size !== orderedIds.length) throw new BadRequestException('orderedIds contains duplicate recommendation IDs');

    const existing = await this.prisma.distributionRecommendation.findMany({
      where: { id: { in: orderedIds } },
      select: { id: true },
    });
    if (existing.length !== orderedIds.length) throw new NotFoundException('One or more recommendations were not found');

    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.distributionRecommendation.update({
          where: { id },
          data: { priorityRank: index + 1 },
        }),
      ),
    );

    return this.prisma.distributionRecommendation.findMany({
      where: { id: { in: orderedIds } },
      include: { puskesmas: true, items: { include: { obat: true } } },
      orderBy: [{ priorityRank: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async approveRecommendation(id: string, actorUserId: string) {
    const recommendation = await this.ensureDecisionIsAllowed(id);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.distributionRecommendation.update({
        where: { id: recommendation.id },
        data: { status: RecommendationStatus.APPROVED },
        include: { puskesmas: true, items: { include: { obat: true } } },
      });
      await tx.shipmentTrackingEvent.create({
        data: { recommendationId: id, status: TrackingStatus.APPROVED, actorUserId, note: 'Recommendation approved by IFK.' },
      });
      return updated;
    });
  }

  async rejectRecommendation(id: string, actorUserId: string, note: string) {
    const trimmedNote = note?.trim();
    if (!trimmedNote) throw new BadRequestException('Reject note is required');
    const recommendation = await this.ensureDecisionIsAllowed(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.distributionRecommendation.update({
        where: { id: recommendation.id },
        data: { status: RecommendationStatus.REJECTED },
        include: { puskesmas: true, items: { include: { obat: true } } },
      });
      await tx.shipmentTrackingEvent.create({ data: { recommendationId: id, status: TrackingStatus.REJECTED, actorUserId, note: trimmedNote } });
      return updated;
    });
  }

  async createShipmentRequest(data: CreateShipmentRequestDto, user: CurrentUser) {
    if (!data.items.length) throw new BadRequestException('Shipment request must contain at least one item');
    const puskesmasId = requiredScopedPuskesmasId(user, data.puskesmasId);
    const id = `REQ-${puskesmasId}-${data.periode.slice(0, 10)}-${Date.now()}`;
    return this.prisma.$transaction(async (tx) => {
      const recommendation = await tx.distributionRecommendation.create({
        data: {
          id,
          puskesmasId,
          periode: toDate(data.periode),
          status: RecommendationStatus.PENDING,
          urgency: data.items.some((item) => item.jumlah > 0) ? 'WARNING' : 'ROUTINE',
          source: RecommendationSource.RULE_BASED_FALLBACK,
          priorityRank: 100,
          justification: data.justification ?? 'Requested from AI demand forecast.',
          items: { create: data.items.map((item) => ({ obatId: item.obatId, aiQuantity: item.jumlah, finalQuantity: item.jumlah })) },
        },
        include: { puskesmas: true, items: { include: { obat: true } } },
      });
      await tx.shipmentTrackingEvent.create({ data: { recommendationId: recommendation.id, status: TrackingStatus.REQUESTED, actorUserId: user.id, note: 'Requested by puskesmas from demand forecast.' } });
      return recommendation;
    });
  }

  async runAiAllocation(data: RunAiAllocationDto) {
    const periode = toDate(data.periode);
    const runs = await this.prisma.forecastRun.findMany({
      where: { periode },
      include: { puskesmas: true, prediksi: { include: { obat: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const latestByFacility = new Map<string, (typeof runs)[number]>();
    for (const run of runs) if (!latestByFacility.has(run.puskesmasId)) latestByFacility.set(run.puskesmasId, run);
    const latestRuns = [...latestByFacility.values()];
    if (!latestRuns.length) throw new BadRequestException('No AI forecast runs found for allocation period');

    const l1 = latestRuns.flatMap((run) => run.prediksi.map((row) => ({
      facility_id: run.puskesmasId,
      drug_id: row.obatId,
      forecast_demand: row.kebutuhanObat,
      current_stock: row.stokSaatIni,
      total_requirement: row.totalRekomendasi,
      forecast_period: data.periode.slice(0, 10),
    })));
    const byDrug = new Map<string, number>();
    for (const row of l1) byDrug.set(row.drug_id, (byDrug.get(row.drug_id) ?? 0) + row.total_requirement);
    const request: AiAllocateRequest = {
      run_id: `DIST-${data.periode.slice(0, 10)}`,
      l1_forecasts: l1,
      ifk_stock: [...byDrug.entries()].map(([drug_id, available_units]) => ({ drug_id, available_units })),
      stockout_history: null,
    };
    const allocation = await this.ai.allocate(request);
    const routeSummary = JSON.parse(JSON.stringify(allocation.summary)) as Prisma.InputJsonValue;
    const grouped = new Map<string, typeof allocation.allocations>();
    for (const item of allocation.allocations) grouped.set(item.facility_id, [...(grouped.get(item.facility_id) ?? []), item]);
    const sortedGroups = [...grouped.entries()].sort((a, b) => Math.max(...b[1].map((item) => item.priority_score)) - Math.max(...a[1].map((item) => item.priority_score)));

    await this.prisma.$transaction(async (tx) => {
      for (const [index, [puskesmasId, items]] of sortedGroups.entries()) {
        const recommendationId = `REC-AI-DIST-${puskesmasId}-${data.periode.slice(0, 10)}`;
        await tx.distributionRecommendationItem.deleteMany({ where: { recommendationId } });
        const urgency = items.some((item) => item.unmet > 0) ? 'CRITICAL' : items.some((item) => item.coverage_ratio < 1) ? 'WARNING' : 'ROUTINE';
        const recommendation = await tx.distributionRecommendation.upsert({
          where: { id: recommendationId },
          update: {
            periode,
            status: RecommendationStatus.PENDING,
            urgency,
            source: 'HF_AI_LAYER2',
            priorityRank: index + 1,
            justification: items.find((item) => item.justification)?.justification ?? `AI allocation covers ${items.length} medicine item(s).`,
            routeSummary,
          },
          create: {
            id: recommendationId,
            puskesmasId,
            periode,
            status: RecommendationStatus.PENDING,
            urgency,
            source: 'HF_AI_LAYER2',
            priorityRank: index + 1,
            justification: items.find((item) => item.justification)?.justification ?? `AI allocation covers ${items.length} medicine item(s).`,
            routeSummary,
          },
        });
        for (const item of items) {
          await tx.distributionRecommendationItem.create({
            data: { recommendationId: recommendation.id, obatId: item.drug_id, aiQuantity: item.allocated, finalQuantity: item.allocated },
          });
        }
        const hasRequestedEvent = await tx.shipmentTrackingEvent.findFirst({ where: { recommendationId, status: TrackingStatus.REQUESTED } });
        if (!hasRequestedEvent) await tx.shipmentTrackingEvent.create({ data: { recommendationId, status: TrackingStatus.REQUESTED, note: 'Generated by hosted AI allocation.' } });
      }
    });

    return this.listRecommendations({ status: RecommendationStatus.PENDING });
  }

  async rerequestRecommendation(id: string, user: CurrentUser) {
    const recommendation = await this.prisma.distributionRecommendation.findUnique({ where: { id } });
    if (!recommendation) throw new NotFoundException('Recommendation not found');
    assertOwnPuskesmas(user, recommendation.puskesmasId);
    if (recommendation.status !== RecommendationStatus.REJECTED && recommendation.status !== RecommendationStatus.CANCELLED) {
      throw new BadRequestException('Only rejected or cancelled recommendations can be re-requested');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.shipmentTrackingEvent.create({
        data: { recommendationId: id, status: TrackingStatus.REQUESTED, actorUserId: user.id, note: 'Shipment re-requested by puskesmas.' },
      });
      const updated = await tx.distributionRecommendation.update({
        where: { id },
        data: { status: RecommendationStatus.PENDING },
        include: { puskesmas: true, items: { include: { obat: true } }, trackingEvents: { include: { actor: true }, orderBy: { createdAt: 'desc' } } },
      });
      return updated;
    });
  }

  async getTracking(id: string, user?: CurrentUser) {
    await this.getRecommendation(id, user);
    return this.prisma.shipmentTrackingEvent.findMany({
      where: { recommendationId: id },
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addTrackingEvent(id: string, user: CurrentUser, data: TrackingEventDto) {
    const recommendation = await this.prisma.distributionRecommendation.findUniqueOrThrow({ where: { id } });
    this.assertTrackingActor(user, recommendation.puskesmasId, data.status);
    this.assertTrackingTransition(recommendation.status, data.status);
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.shipmentTrackingEvent.create({
        data: { recommendationId: id, status: data.status, note: data.note?.trim() || null, actorUserId: user.id },
      });

      if (data.status === TrackingStatus.DISPATCHED) {
        await tx.distributionRecommendation.update({ where: { id }, data: { status: RecommendationStatus.DISPATCHED } });
      }
      if (data.status === TrackingStatus.RECEIVED) {
        await tx.distributionRecommendation.update({ where: { id }, data: { status: RecommendationStatus.RECEIVED } });
      }
      return event;
    });
  }

  private assertTrackingActor(user: CurrentUser, puskesmasId: string, next: TrackingStatus) {
    if (user.role === UserRole.BIDAN_PUSKESMAS) {
      assertOwnPuskesmas(user, puskesmasId);
      if (next !== TrackingStatus.RECEIVED) throw new BadRequestException('Bidan can only confirm received shipments');
      return;
    }
    if (user.role === UserRole.IFK_ADMIN) {
      if (next === TrackingStatus.RECEIVED) throw new BadRequestException('Received shipments must be confirmed by puskesmas');
      return;
    }
    throw new BadRequestException('User role cannot update shipment tracking');
  }

  private assertTrackingTransition(current: RecommendationStatus, next: TrackingStatus) {
    const allowed: Record<RecommendationStatus, TrackingStatus[]> = {
      [RecommendationStatus.PENDING]: [],
      [RecommendationStatus.APPROVED]: [TrackingStatus.DISPATCHED],
      [RecommendationStatus.REJECTED]: [],
      [RecommendationStatus.DISPATCHED]: [TrackingStatus.RECEIVED, TrackingStatus.ISSUE_REPORTED],
      [RecommendationStatus.RECEIVED]: [],
      [RecommendationStatus.CANCELLED]: [],
    };
    if (!allowed[current].includes(next)) throw new BadRequestException('Invalid shipment tracking transition');
  }

  listAlerts() {
    return this.prisma.alert.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getIfkDashboard() {
    const [recommendations, puskesmas, alerts] = await Promise.all([
      this.prisma.distributionRecommendation.findMany({
        include: { puskesmas: true, items: { include: { obat: true } }, trackingEvents: { include: { actor: true }, orderBy: { createdAt: 'desc' } } },
        orderBy: [{ priorityRank: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.puskesmas.findMany({ select: { id: true, nama: true, latitude: true, longitude: true } }),
      this.prisma.alert.findMany({ where: { resolved: false }, orderBy: { createdAt: 'desc' } }),
    ]);

    const critical = recommendations.filter((item) => item.urgency === 'CRITICAL').length;
    const warning = recommendations.filter((item) => item.urgency === 'WARNING').length;
    const pending = recommendations.filter((item) => item.status === RecommendationStatus.PENDING).length;
    const activeFacilityIds = new Set(recommendations.filter((item) => item.status !== RecommendationStatus.RECEIVED && item.status !== RecommendationStatus.CANCELLED).map((item) => item.puskesmasId));
    const safe = puskesmas.filter((item) => !activeFacilityIds.has(item.id)).length;
    const totalRisk = Math.max(1, critical + warning + safe + pending);

    const actions = recommendations.slice(0, 3).map((item) => {
      const alert = alerts.find((row) => row.puskesmasId === item.puskesmasId);
      return {
        id: item.id,
        name: item.puskesmas.nama,
        status: item.urgency === 'CRITICAL' ? 'critical' : item.urgency === 'WARNING' ? 'warning' : 'safe',
        statusLabel: item.urgency,
        updatedAt: item.updatedAt,
        weather: alert?.message ?? item.puskesmas.rainyAccess,
        supply: item.items.map((row) => `${row.obat.nama} ${row.finalQuantity} ${row.obat.satuan}`).join(', '),
        pointStatus: item.urgency === 'CRITICAL' ? 'critical' : item.urgency === 'WARNING' ? 'anticipatory' : 'regular',
        position: item.puskesmas.latitude != null && item.puskesmas.longitude != null ? [item.puskesmas.latitude, item.puskesmas.longitude] : null,
      };
    });

    const approvalLogs = recommendations.slice(0, 5).flatMap((item) => {
      const event = item.trackingEvents[0];
      if (!event) return [];
      return [{
        timestamp: event.createdAt,
        entity: item.puskesmas.nama,
        action: item.items.map((row) => row.obat.nama).join(', ') || item.source,
        operator: event.actor?.username ?? 'SYSTEM',
        status: event.status === TrackingStatus.REJECTED ? 'rejected' : event.status === TrackingStatus.REQUESTED ? 'pending' : 'approved',
      }];
    });

    return {
      kpis: [
        { label: 'Critical clinics', value: critical, delta: `${alerts.filter((item) => item.severity === 'CRITICAL').length} active alerts`, tone: 'critical', progress: Math.round((critical / totalRisk) * 100) },
        { label: 'Warning clinics', value: warning, delta: `${alerts.filter((item) => item.severity === 'HIGH').length} high alerts`, tone: 'warning', progress: Math.round((warning / totalRisk) * 100) },
        { label: 'Safe clinics', value: safe, delta: `${puskesmas.length} registered`, tone: 'safe', progress: Math.round((safe / Math.max(1, puskesmas.length)) * 100) },
        { label: 'Pending approval', value: pending, delta: 'review queue', tone: 'primary', progress: Math.round((pending / Math.max(1, recommendations.length)) * 100), icon: 'clipboardCheck' },
      ],
      actions,
      mapPoints: actions.flatMap((item) => item.position ? [{ id: item.id, name: item.name, status: item.pointStatus, position: item.position }] : []),
      approvalLogs,
      syncFrequencySeconds: 30,
      alertCount: alerts.length,
      routeCount: recommendations.length,
    };
  }

  async getIfkFacilities() {
    const facilities = await this.prisma.puskesmas.findMany({
      include: {
        users: { where: { active: true }, select: { displayName: true, username: true }, take: 1 },
        pregnancies: { where: { active: true }, select: { id: true, riskLevel: true } },
        stok: { include: { obat: true }, orderBy: { periode: 'desc' } },
        recommendations: { include: { items: { include: { obat: true } }, trackingEvents: { include: { actor: true }, orderBy: { createdAt: 'desc' } } }, orderBy: { updatedAt: 'desc' } },
        alerts: { where: { resolved: false }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { id: 'asc' },
    });

    return facilities.map((facility) => {
      const latestStocks = this.latestStockByDrug(facility.stok);
      const criticalStocks = latestStocks.filter((row) => row.stokSaatIni <= 5);
      const activeRecommendation = facility.recommendations.find((row) => row.status !== RecommendationStatus.RECEIVED && row.status !== RecommendationStatus.CANCELLED);
      const delivered = facility.recommendations.filter((row) => row.status === RecommendationStatus.RECEIVED).length;
      const alert = facility.alerts[0];
      const risk = alert?.severity === 'CRITICAL' || activeRecommendation?.urgency === 'CRITICAL' ? 'critical' : alert || activeRecommendation?.urgency === 'WARNING' || criticalStocks.length ? 'warning' : 'routine';
      const lastStockDate = latestStocks[0]?.periode ?? null;
      return {
        id: facility.id,
        name: facility.nama,
        location: [facility.kecamatan, facility.kabupatenKota, facility.provinsi].filter(Boolean).join(', '),
        headOfClinic: facility.users[0]?.displayName ?? facility.users[0]?.username ?? null,
        activePregnancies: facility.pregnancies.length,
        highRiskPregnancies: facility.pregnancies.filter((row) => row.riskLevel === 'HIGH').length,
        logisticDate: lastStockDate,
        criticalStockCount: criticalStocks.length,
        criticalStockItems: criticalStocks.map((row) => `${row.obat.nama} (${row.stokSaatIni} ${row.obat.satuan})`),
        deliveries: delivered,
        risk,
        riskLabel: risk === 'critical' ? 'Critical' : risk === 'warning' ? 'Warning' : 'Routine',
        rainyAccess: facility.rainyAccess,
        weatherAlert: alert?.message ?? null,
        coldChainReady: facility.coldChainReady,
        leadTimeHari: facility.leadTimeHari,
        jarakKeIfkKm: facility.jarakKeIfkKm,
        kapasitasSimpanObat: facility.kapasitasSimpanObat,
        statusEndemisMalaria: facility.statusEndemisMalaria,
        latitude: facility.latitude,
        longitude: facility.longitude,
        activeRecommendation,
        nearbyCandidates: [],
      };
    }).map((facility, _index, allFacilities) => ({
      ...facility,
      nearbyCandidates: allFacilities
        .filter((candidate) => candidate.id !== facility.id && candidate.risk === 'routine')
        .sort((a, b) => (a.jarakKeIfkKm ?? Number.MAX_SAFE_INTEGER) - (b.jarakKeIfkKm ?? Number.MAX_SAFE_INTEGER))
        .slice(0, 3)
        .map((candidate) => ({ id: candidate.id, name: candidate.name, distance: candidate.jarakKeIfkKm, riskLabel: candidate.riskLabel })),
    }));
  }

  async getIfkDecisionHistory() {
    const recommendations = await this.prisma.distributionRecommendation.findMany({
      where: { status: { not: RecommendationStatus.PENDING } },
      include: { puskesmas: true, items: { include: { obat: true } }, trackingEvents: { include: { actor: true }, orderBy: { createdAt: 'desc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    const rows = recommendations.map((recommendation) => {
      const lastEvent = recommendation.trackingEvents[0];
      return {
        id: recommendation.id,
        date: lastEvent?.createdAt ?? recommendation.updatedAt,
        officer: lastEvent?.actor?.username ?? 'SYSTEM',
        clinic: recommendation.puskesmas.nama,
        action: recommendation.items.map((item) => `${item.obat.nama} (${item.finalQuantity} ${item.obat.satuan})`).join(', '),
        prediction: recommendation.justification ?? recommendation.source,
        decision: recommendation.status,
        tone: recommendation.status === RecommendationStatus.REJECTED ? 'red' : 'green',
      };
    });
    const approvedStatuses: RecommendationStatus[] = [RecommendationStatus.APPROVED, RecommendationStatus.DISPATCHED, RecommendationStatus.RECEIVED];
    const approved = recommendations.filter((item) => approvedStatuses.includes(item.status)).length;
    const dispatched = recommendations.filter((item) => item.status === RecommendationStatus.DISPATCHED || item.status === RecommendationStatus.RECEIVED).length;
    const rejected = recommendations.filter((item) => item.status === RecommendationStatus.REJECTED).length;
    const criticalHandled = recommendations.filter((item) => item.urgency === 'CRITICAL' && item.status !== RecommendationStatus.REJECTED).length;
    const matchedRate = recommendations.length ? Math.round((approved / recommendations.length) * 1000) / 10 : 0;
    return {
      metrics: [
        { label: 'Stockouts Prevented', value: String(criticalHandled), note: 'Critical recommendations handled', icon: 'settings', tone: 'green' },
        { label: 'Approved Decisions', value: String(approved), note: 'IFK recommendations', icon: 'clock', tone: 'blue' },
        { label: 'Total Dispatches', value: String(dispatched), note: 'Dispatched or received shipments', icon: 'truck', tone: 'blue' },
      ],
      rows,
      bars: this.weekdayDecisionBars(rows),
      compliance: {
        rating: matchedRate,
        primaryDeviationFactor: rejected ? 'Rejected distribution recommendations' : 'No deviation recorded',
        summary: `IFK accepted ${approved} of ${recommendations.length} completed decisions. ${rejected} rejected recommendations remain auditable.`,
      },
    };
  }

  async getIfkEnvironment() {
    const [facilities, alerts] = await Promise.all([
      this.prisma.puskesmas.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.alert.findMany({ where: { resolved: false }, orderBy: { createdAt: 'desc' } }),
    ]);
    const weatherByFacility = new Map<string, LiveWeather>();
    await Promise.all(facilities.map(async (facility) => {
      if (facility.latitude == null || facility.longitude == null) return;
      const weather = await this.fetchLiveWeather(facility.latitude, facility.longitude);
      if (weather) weatherByFacility.set(facility.id, weather);
    }));

    const points = facilities.flatMap((facility) => {
      if (facility.latitude == null || facility.longitude == null) return [];
      const alert = alerts.find((row) => row.puskesmasId === facility.id);
      const weather = weatherByFacility.get(facility.id);
      const risk = this.environmentPointRisk(alert?.severity, facility.rainyAccess, weather);
      const metric = weather ? this.weatherMetric(weather) : alert?.message ?? facility.rainyAccess;
      return [{ id: facility.id, name: facility.nama, position: [facility.latitude, facility.longitude], risk, metric }];
    });
    const forecasts = facilities.slice(0, 6).map((facility) => {
      const alert = alerts.find((row) => row.puskesmasId === facility.id);
      const weather = weatherByFacility.get(facility.id);
      const risk = this.forecastRisk(alert?.severity, facility.rainyAccess, weather);
      return {
        location: facility.nama,
        risk,
        status: risk === 'blocked' ? 'Blocked risk' : risk === 'warning' ? 'Elevated' : 'Stable',
        temperature: weather?.temperatureC == null ? '-' : `${Math.round(weather.temperatureC)}°C`,
        metric: weather ? `Rain ${this.round1(weather.rainMm ?? weather.precipitationMm ?? 0)}mm · Prob ${weather.maxPrecipitationProbabilityPct}%` : `Lead time - ${facility.rainyAccess}`,
        bars: weather?.bars ?? this.forecastBars(risk),
      };
    });
    const routes = facilities.map((facility) => {
      const alert = alerts.find((row) => row.puskesmasId === facility.id);
      const weather = weatherByFacility.get(facility.id);
      const risk = this.routeWeatherRisk(alert?.severity, facility.rainyAccess, weather);
      return {
        id: facility.id,
        route: `IFK-${facility.id}`,
        clinics: facility.nama,
        risk,
        status: risk >= 80 ? 'critical' : risk >= 50 ? 'elevated' : 'operational',
        blockedAt: alert?.createdAt ?? null,
        confidence: weather ? 'OPEN_METEO' : alert?.severity ?? 'LOW',
      };
    });
    return { points, forecasts, routes, alerts, weatherSource: weatherByFacility.size ? 'OPEN_METEO' : 'DATABASE_FALLBACK' };
  }

  createPlan(data: CreateAllocationPlanDto) {
    return this.prisma.allocationPlan.create({
      data: {
        puskesmasId: data.puskesmasId,
        periode: toDate(data.periode),
        items: { create: data.items },
      },
      include: { items: true },
    });
  }

  listPlans(puskesmasId?: string) {
    return this.prisma.allocationPlan.findMany({
      where: { puskesmasId },
      include: { puskesmas: true, items: { include: { obat: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  getPlan(id: number) {
    return this.prisma.allocationPlan.findUniqueOrThrow({ where: { id }, include: { puskesmas: true, items: { include: { obat: true } } } });
  }

  updatePlan(id: number, data: UpdateAllocationPlanDto) {
    return this.prisma.$transaction(async (tx) => {
      if (data.items) {
        await tx.allocationPlanItem.deleteMany({ where: { allocationPlanId: id } });
      }
      return tx.allocationPlan.update({
        where: { id },
        data: {
          puskesmasId: data.puskesmasId,
          periode: data.periode ? toDate(data.periode) : undefined,
          items: data.items ? { create: data.items } : undefined,
        },
        include: { puskesmas: true, items: { include: { obat: true } } },
      });
    });
  }

  async removePlan(id: number) {
    await this.prisma.$transaction(async (tx) => {
      await tx.allocationPlanItem.deleteMany({ where: { allocationPlanId: id } });
      await tx.allocationPlan.delete({ where: { id } });
    });
    return { id, deleted: true };
  }

  async simulate(id: number) {
    const plan = await this.prisma.allocationPlan.update({
      where: { id },
      data: { status: 'SIMULATED' },
      include: { puskesmas: true, items: { include: { obat: true } } },
    });
    const alerts = [];
    const routeRisk = plan.puskesmas.rainyAccess === 'TERGANGGU' || plan.puskesmas.rainyAccess === 'TERBATAS';

    if (routeRisk) {
      alerts.push(
        await this.prisma.alert.create({
          data: {
            puskesmasId: plan.puskesmasId,
            type: 'ROUTE_DISRUPTION',
            severity: 'HIGH',
            message: `Rainy-season access risk for ${plan.puskesmas.nama}; lead time ${plan.puskesmas.leadTimeHari ?? 0} days`,
          },
        }),
      );
    }

    for (const item of plan.items) {
      if (item.obat.perluColdChain && !plan.puskesmas.coldChainReady) {
        alerts.push(
          await this.prisma.alert.create({
            data: {
              puskesmasId: plan.puskesmasId,
              type: 'COLD_CHAIN_MISMATCH',
              severity: 'CRITICAL',
              message: `${item.obatId} requires cold chain but ${plan.puskesmas.nama} is not cold-chain ready`,
            },
          }),
        );
      }
    }

    return {
      plan,
      riskSummary: {
        rainyAccess: plan.puskesmas.rainyAccess,
        skorAksesibilitas: plan.puskesmas.skorAksesibilitas,
        leadTimeHari: plan.puskesmas.leadTimeHari,
        coldChainReady: plan.puskesmas.coldChainReady,
        alertCount: alerts.length,
      },
      alerts,
    };
  }

  private async ensureDecisionIsAllowed(id: string) {
    const recommendation = await this.prisma.distributionRecommendation.findUnique({ where: { id } });
    if (!recommendation) throw new NotFoundException('Recommendation not found');
    if (recommendation.status !== RecommendationStatus.PENDING) {
      throw new BadRequestException('Only pending recommendations can be approved or rejected');
    }
    return recommendation;
  }

  private latestStockByDrug(rows: Array<{ obatId: string; periode: Date; stokSaatIni: number; obat: { nama: string; satuan: string } }>) {
    const byDrug = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const existing = byDrug.get(row.obatId);
      if (!existing || row.periode > existing.periode) byDrug.set(row.obatId, row);
    }
    return [...byDrug.values()].sort((a, b) => b.periode.getTime() - a.periode.getTime());
  }

  private weekdayDecisionBars(rows: Array<{ date: Date; tone: string }>) {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return days.map((day, index) => {
      const matched = rows.filter((row) => ((row.date.getDay() + 6) % 7) === index && row.tone === 'green').length;
      const deviated = rows.filter((row) => ((row.date.getDay() + 6) % 7) === index && row.tone === 'red').length;
      return { day, green: matched, red: deviated };
    });
  }

  private forecastBars(risk: 'stable' | 'warning' | 'blocked') {
    if (risk === 'blocked') return ['high', 'critical', 'critical', 'high', 'medium', 'medium', 'high'];
    if (risk === 'warning') return ['medium', 'medium', 'high', 'medium', 'low', 'medium', 'high'];
    return ['low', 'low', 'medium', 'low', 'low', 'medium', 'low'];
  }

  private async fetchLiveWeather(latitude: number, longitude: number): Promise<LiveWeather | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(process.env.OPEN_METEO_TIMEOUT_MS ?? '7000'));
    const baseUrl = process.env.OPEN_METEO_FORECAST_URL ?? 'https://api.open-meteo.com/v1/forecast';
    const url = new URL(baseUrl);
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m');
    url.searchParams.set('hourly', 'precipitation_probability,precipitation,rain');
    url.searchParams.set('forecast_days', '7');
    url.searchParams.set('timezone', 'auto');

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) return null;
      const data = await response.json() as OpenMeteoResponse;
      return this.mapOpenMeteoWeather(data);
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapOpenMeteoWeather(data: OpenMeteoResponse): LiveWeather {
    const probability = data.hourly?.precipitation_probability ?? [];
    const precipitation = data.hourly?.precipitation ?? [];
    const rain = data.hourly?.rain ?? [];
    const maxProbability = Math.max(0, ...probability.map((value) => Number(value) || 0));
    const dailyPrecipitation = Array.from({ length: 7 }, (_, day) => {
      const start = day * 24;
      const end = start + 24;
      const total = precipitation.slice(start, end).reduce((sum, value, index) => sum + (Number(value) || 0) + (Number(rain[start + index]) || 0), 0);
      const dayProbability = Math.max(0, ...probability.slice(start, end).map((value) => Number(value) || 0));
      return { total, probability: dayProbability };
    });
    const maxDailyPrecipitation = Math.max(0, ...dailyPrecipitation.map((item) => item.total));

    return {
      source: 'OPEN_METEO',
      temperatureC: data.current?.temperature_2m ?? null,
      humidityPct: data.current?.relative_humidity_2m ?? null,
      precipitationMm: data.current?.precipitation ?? null,
      rainMm: data.current?.rain ?? null,
      windKph: data.current?.wind_speed_10m ?? null,
      weatherCode: data.current?.weather_code ?? null,
      maxPrecipitationProbabilityPct: Math.round(maxProbability),
      maxDailyPrecipitationMm: this.round1(maxDailyPrecipitation),
      bars: dailyPrecipitation.map((item) => this.weatherBar(item.probability, item.total)),
      fetchedAt: new Date().toISOString(),
    };
  }

  private weatherBar(probability: number, precipitationMm: number): 'low' | 'medium' | 'high' | 'critical' {
    if (probability >= 85 || precipitationMm >= 30) return 'critical';
    if (probability >= 65 || precipitationMm >= 15) return 'high';
    if (probability >= 35 || precipitationMm >= 5) return 'medium';
    return 'low';
  }

  private forecastRisk(severity: string | undefined, rainyAccess: string, weather?: LiveWeather): 'stable' | 'warning' | 'blocked' {
    if (severity === 'CRITICAL' || rainyAccess === 'TERGANGGU' || (weather && (weather.maxPrecipitationProbabilityPct >= 85 || weather.maxDailyPrecipitationMm >= 30))) return 'blocked';
    if (severity || rainyAccess === 'TERBATAS' || (weather && (weather.maxPrecipitationProbabilityPct >= 55 || weather.maxDailyPrecipitationMm >= 10))) return 'warning';
    return 'stable';
  }

  private environmentPointRisk(severity: string | undefined, rainyAccess: string, weather?: LiveWeather): 'low' | 'medium' | 'high' | 'critical' {
    const risk = this.forecastRisk(severity, rainyAccess, weather);
    if (risk === 'blocked') return weather && weather.maxDailyPrecipitationMm < 30 && weather.maxPrecipitationProbabilityPct < 85 ? 'high' : 'critical';
    if (risk === 'warning') return 'medium';
    return 'low';
  }

  private routeWeatherRisk(severity: string | undefined, rainyAccess: string, weather?: LiveWeather) {
    const alertRisk = severity === 'CRITICAL' ? 95 : severity === 'HIGH' ? 82 : 0;
    const accessRisk = rainyAccess === 'TERGANGGU' ? 75 : rainyAccess === 'TERBATAS' ? 58 : 25;
    const weatherRisk = weather ? Math.min(95, Math.max(weather.maxPrecipitationProbabilityPct, weather.maxDailyPrecipitationMm * 3)) : 0;
    return Math.round(Math.max(alertRisk, accessRisk, weatherRisk));
  }

  private weatherMetric(weather: LiveWeather) {
    return `${Math.round(weather.temperatureC ?? 0)}°C · Rain ${this.round1(weather.rainMm ?? weather.precipitationMm ?? 0)}mm · ${weather.maxPrecipitationProbabilityPct}%`;
  }

  private round1(value: number) {
    return Math.round(value * 10) / 10;
  }
}
