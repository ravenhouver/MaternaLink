import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAllocationPlanDto } from './distribution.dto';

const toDate = (value: string) => new Date(value);

@Injectable()
export class DistributionService {
  constructor(private readonly prisma: PrismaService) {}

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

  getPlan(id: number) {
    return this.prisma.allocationPlan.findUniqueOrThrow({ where: { id }, include: { items: true } });
  }

  async simulate(id: number) {
    const plan = await this.prisma.allocationPlan.update({ where: { id }, data: { status: 'SIMULATED' }, include: { puskesmas: true, items: { include: { obat: true } } } });
    const alerts = [];
    if (plan.puskesmas.rainyAccess === 'TERGANGGU') {
      alerts.push(await this.prisma.alert.create({ data: { puskesmasId: plan.puskesmasId, type: 'ROUTE_DISRUPTION', severity: 'HIGH', message: 'Route disrupted during rainy season access simulation' } }));
    }
    for (const item of plan.items) {
      if (item.obat.perluColdChain && !plan.puskesmas.coldChainReady) {
        alerts.push(await this.prisma.alert.create({ data: { puskesmasId: plan.puskesmasId, type: 'COLD_CHAIN_MISMATCH', severity: 'CRITICAL', message: `${item.obatId} requires cold chain but puskesmas is not ready` } }));
      }
    }
    return { plan, alerts };
  }
}
