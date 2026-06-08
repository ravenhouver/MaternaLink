import { ConflictException, Injectable } from '@nestjs/common';
import { QueueStatus, UserRole } from '@prisma/client';
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

    return this.prisma.patientQueue.create({
      data: {
        patientId: data.patientId,
        pregnancyId: data.pregnancyId,
        puskesmasId,
        queueNo,
        assignedDoctor: 'dr. Ratna Wulandari',
      },
      include: { patient: true, pregnancy: true },
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
}
