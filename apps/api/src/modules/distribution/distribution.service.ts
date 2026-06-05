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
}
