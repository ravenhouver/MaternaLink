import { Injectable } from '@nestjs/common';
import { QueueStatus, RecommendationStatus, RecommendationUrgency, UserRole } from '@prisma/client';
import type { CurrentUser } from '../../common/auth/current-user';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: CurrentUser) {
    if (user.role === UserRole.IFK_ADMIN) return this.getIfkSummary(user.role);
    return this.getBidanSummary(user);
  }

  private async getBidanSummary(user: CurrentUser) {
    const puskesmasId = user.puskesmasId ?? undefined;
    const [waiting, examining, completed, totalPatients, criticalMedicine] = await Promise.all([
      this.prisma.patientQueue.count({ where: { puskesmasId, status: QueueStatus.WAITING } }),
      this.prisma.patientQueue.count({ where: { puskesmasId, status: QueueStatus.EXAMINING } }),
      this.prisma.patientQueue.count({ where: { puskesmasId, status: QueueStatus.COMPLETED } }),
      this.prisma.patient.count({ where: { puskesmasId } }),
      this.prisma.stokPuskesmas.count({ where: { puskesmasId, stokSaatIni: { lte: 5 } } }),
    ]);

    return {
      role: UserRole.BIDAN_PUSKESMAS,
      queue: { waiting, examining, completed },
      patients: { total: totalPatients },
      medicine: { criticalCount: criticalMedicine },
    };
  }

  private async getIfkSummary(role: UserRole) {
    const [pending, approved, rejected, critical, activeDeliveries] = await Promise.all([
      this.prisma.distributionRecommendation.count({ where: { status: RecommendationStatus.PENDING } }),
      this.prisma.distributionRecommendation.count({ where: { status: RecommendationStatus.APPROVED } }),
      this.prisma.distributionRecommendation.count({ where: { status: RecommendationStatus.REJECTED } }),
      this.prisma.distributionRecommendation.count({ where: { urgency: RecommendationUrgency.CRITICAL } }),
      this.prisma.distributionRecommendation.count({ where: { status: { in: [RecommendationStatus.APPROVED, RecommendationStatus.DISPATCHED] } } }),
    ]);

    return {
      role,
      recommendations: { pending, approved, rejected, critical },
      deliveries: { active: activeDeliveries },
    };
  }
}
