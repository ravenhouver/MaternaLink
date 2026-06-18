import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, QueueStatus, UserRole } from '@prisma/client';
import type { CurrentUser } from '../../common/auth/current-user';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQueueDto, UpdateQueueStatusDto } from './queue.dto';

const transitionMap: Record<QueueStatus, QueueStatus[]> = {
  WAITING: ['EXAMINING', 'CANCELLED'],
  EXAMINING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateQueueDto, user: CurrentUser) {
    const pregnancy = await this.prisma.pregnancy.findUniqueOrThrow({ where: { id: data.pregnancyId } });
    const puskesmasId = user.role === UserRole.BIDAN_PUSKESMAS ? user.puskesmasId : pregnancy.puskesmasId;
    if (!puskesmasId) throw new ConflictException('Puskesmas context is required');
    const { start, end } = todayRange();
    const count = await this.prisma.patientQueue.count({ where: { puskesmasId, queuedAt: { gte: start, lt: end } } });
    const queueNo = `A-${String(count + 1).padStart(3, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      const queue = await tx.patientQueue.create({
        data: {
          patientId: data.patientId,
          pregnancyId: data.pregnancyId,
          puskesmasId,
          queueNo,
          assignedDoctor: data.assignedDoctor ?? data.screening?.responsibleDoctor ?? user.username,
        },
        include: { patient: true, pregnancy: true },
      });

      if (data.screening) {
        await tx.pregnancy.update({
          where: { id: data.pregnancyId },
          data: {
            visitReason: data.screening.reason,
            chiefComplaint: data.screening.complaint,
            ancVisit: data.screening.ancVisit,
            gestationalAge: data.screening.gestationalAge,
            vitalSigns: data.screening.vitalSigns as Prisma.InputJsonValue | undefined,
            riskFactors: data.screening.riskFactors as Prisma.InputJsonValue | undefined,
            routineMedication: data.screening.routineMedication as Prisma.InputJsonValue | undefined,
            responsibleDoctor: data.screening.responsibleDoctor,
            priority: data.screening.priority,
          },
        });

        await tx.examination.create({
          data: {
            patientId: data.patientId,
            pregnancyId: data.pregnancyId,
            queueId: queue.id,
            puskesmasId,
            source: 'MANUAL',
            complaint: data.screening.complaint,
            vitalSigns: data.screening.vitalSigns as Prisma.InputJsonValue | undefined,
            gestationalAge: data.screening.gestationalAge,
            ancVisit: data.screening.ancVisit,
            medication: data.screening.routineMedication as Prisma.InputJsonValue | undefined,
            notes: data.screening.reason,
            riskSummary: (data.screening.riskSummary ?? { riskLevel: pregnancy.riskLevel, priority: data.screening.priority }) as Prisma.InputJsonValue,
            createdById: user.id,
          },
        });

        await tx.auditLog.create({
          data: { userId: user.id, action: 'queue.screening.create', entityType: 'PatientQueue', entityId: queue.id },
        });
      }

      return queue;
    });
  }

  today(user: CurrentUser, puskesmasId?: string) {
    const range = todayRange();
    const scopedPuskesmasId = user.role === UserRole.BIDAN_PUSKESMAS ? user.puskesmasId : puskesmasId;
    return this.prisma.patientQueue.findMany({
      where: { puskesmasId: scopedPuskesmasId ?? undefined, queuedAt: { gte: range.start, lt: range.end } },
      include: { patient: true, pregnancy: true },
      orderBy: { queuedAt: 'asc' },
    });
  }

  list(user: CurrentUser, filters: { puskesmasId?: string; status?: string }) {
    const scopedPuskesmasId = user.role === UserRole.BIDAN_PUSKESMAS ? user.puskesmasId : filters.puskesmasId;
    const status = Object.values(QueueStatus).includes(filters.status as QueueStatus) ? (filters.status as QueueStatus) : undefined;
    return this.prisma.patientQueue.findMany({
      where: { puskesmasId: scopedPuskesmasId ?? undefined, status },
      include: { patient: true, pregnancy: true },
      orderBy: { queuedAt: 'desc' },
      take: 100,
    });
  }

  async updateStatus(id: string, data: UpdateQueueStatusDto) {
    const existing = await this.prisma.patientQueue.findUniqueOrThrow({ where: { id } });
    if (!transitionMap[existing.status].includes(data.status)) {
      throw new ConflictException('Invalid queue transition');
    }

    return this.prisma.patientQueue.update({
      where: { id },
      data: {
        status: data.status,
        assignedDoctor: data.assignedDoctor ?? existing.assignedDoctor,
        calledAt: data.status === 'EXAMINING' ? new Date() : existing.calledAt,
        completedAt: data.status === 'COMPLETED' ? new Date() : existing.completedAt,
      },
      include: { patient: true, pregnancy: true },
    });
  }

  async remove(id: string, user: CurrentUser) {
    const existing = await this.prisma.patientQueue.findFirstOrThrow({
      where: { id, ...(user.role === UserRole.BIDAN_PUSKESMAS ? { puskesmasId: user.puskesmasId ?? undefined } : {}) },
    });
    await this.prisma.examination.deleteMany({ where: { queueId: existing.id } });
    await this.prisma.patientQueue.delete({ where: { id: existing.id } });
    return { id: existing.id, deleted: true };
  }
}
