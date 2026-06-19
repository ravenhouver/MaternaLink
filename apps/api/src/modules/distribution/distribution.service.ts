import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RecommendationStatus, TrackingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAllocationPlanDto,
  ListRecommendationsQueryDto,
  TrackingEventDto,
  UpdateAllocationPlanDto,
  UpdateRecommendationItemDto,
} from './distribution.dto';

const toDate = (value: string) => new Date(value);

@Injectable()
export class DistributionService {
  constructor(private readonly prisma: PrismaService) {}

  listRecommendations(filters: ListRecommendationsQueryDto = {}) {
    return this.prisma.distributionRecommendation.findMany({
      where: {
        status: filters.status,
        puskesmasId: filters.puskesmasId,
      },
      include: {
        puskesmas: true,
        items: { include: { obat: true }, orderBy: { obatId: 'asc' } },
        trackingEvents: { include: { actor: true }, orderBy: { createdAt: 'desc' } },
      },
      orderBy: [{ priorityRank: 'asc' }, { createdAt: 'desc' }],
    });
  }

  getRecommendation(id: string) {
    return this.prisma.distributionRecommendation.findUniqueOrThrow({
      where: { id },
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

  async rerequestRecommendation(id: string, actorUserId: string) {
    const recommendation = await this.prisma.distributionRecommendation.findUnique({ where: { id } });
    if (!recommendation) throw new NotFoundException('Recommendation not found');
    if (recommendation.status !== RecommendationStatus.REJECTED && recommendation.status !== RecommendationStatus.CANCELLED) {
      throw new BadRequestException('Only rejected or cancelled recommendations can be re-requested');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.shipmentTrackingEvent.create({
        data: { recommendationId: id, status: TrackingStatus.REQUESTED, actorUserId, note: 'Shipment re-requested by puskesmas.' },
      });
      const updated = await tx.distributionRecommendation.update({
        where: { id },
        data: { status: RecommendationStatus.PENDING },
        include: { puskesmas: true, items: { include: { obat: true } }, trackingEvents: { include: { actor: true }, orderBy: { createdAt: 'desc' } } },
      });
      return updated;
    });
  }

  getTracking(id: string) {
    return this.prisma.shipmentTrackingEvent.findMany({
      where: { recommendationId: id },
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addTrackingEvent(id: string, actorUserId: string, data: TrackingEventDto) {
    await this.prisma.distributionRecommendation.findUniqueOrThrow({ where: { id } });
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.shipmentTrackingEvent.create({
        data: { recommendationId: id, status: data.status, note: data.note?.trim() || null, actorUserId },
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

  listAlerts() {
    return this.prisma.alert.findMany({ orderBy: { createdAt: 'desc' } });
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
}
