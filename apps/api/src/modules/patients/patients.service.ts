import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { CurrentUser } from '../../common/auth/current-user';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './patients.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreatePatientDto, user: CurrentUser) {
    const puskesmasId = user.role === UserRole.BIDAN_PUSKESMAS ? user.puskesmasId : user.puskesmasId ?? 'PKM-001';
    if (!puskesmasId) throw new Error('Puskesmas context is required');

    return this.prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          fullName: data.fullName,
          nik: data.nik,
          phone: data.phone,
          address: data.address,
          puskesmasId,
        },
      });

      const pregnancy = await tx.pregnancy.create({
        data: {
          patientId: patient.id,
          puskesmasId,
          gestationalAge: data.gestationalAge,
          ancVisit: data.ancVisit,
          riskLevel: data.riskLevel ?? 'LOW',
        },
      });

      await tx.auditLog.create({
        data: { userId: user.id, action: 'patient.create', entityType: 'Patient', entityId: patient.id },
      });

      return { patient, pregnancy };
    });
  }

  list(user: CurrentUser) {
    return this.prisma.patient.findMany({
      where: user.role === UserRole.BIDAN_PUSKESMAS ? { puskesmasId: user.puskesmasId ?? undefined } : undefined,
      include: { pregnancies: { where: { active: true }, orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  get(id: string, user: CurrentUser) {
    return this.prisma.patient.findFirstOrThrow({
      where: { id, ...(user.role === UserRole.BIDAN_PUSKESMAS ? { puskesmasId: user.puskesmasId ?? undefined } : {}) },
      include: { pregnancies: { orderBy: { createdAt: 'desc' } }, examinations: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
  }
}
