import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import type { CurrentUser } from '../../common/auth/current-user';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto, UpdatePatientDto } from './patients.dto';

const toDate = (value?: string) => (value ? new Date(value) : undefined);

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreatePatientDto, user: CurrentUser) {
    const puskesmasId = user.puskesmasId;
    if (!puskesmasId) throw new Error('Puskesmas context is required');

    return this.prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          fullName: data.fullName,
          nik: data.nik,
          dateOfBirth: toDate(data.dateOfBirth),
          phone: data.phone,
          address: data.address,
          bpjsNumber: data.bpjsNumber,
          emergencyName: data.emergencyName,
          emergencyPhone: data.emergencyPhone,
          bloodType: data.bloodType,
          allergy: data.allergy,
          chronicHistory: data.chronicHistory,
          puskesmasId,
        },
      });

      const pregnancy = await tx.pregnancy.create({
        data: {
          patientId: patient.id,
          puskesmasId,
          lmp: toDate(data.lmp),
          edd: toDate(data.edd),
          gestationalAge: data.gestationalAge,
          ancVisit: data.ancVisit,
          gravida: data.gravida,
          para: data.para,
          abortus: data.abortus,
          pregnancyType: data.pregnancyType,
          visitReason: data.visitReason,
          chiefComplaint: data.chiefComplaint,
          emergencySigns: data.emergencySigns as Prisma.InputJsonValue | undefined,
          vitalSigns: data.vitalSigns as Prisma.InputJsonValue | undefined,
          riskFactors: data.riskFactors as Prisma.InputJsonValue | undefined,
          routineMedication: data.routineMedication as Prisma.InputJsonValue | undefined,
          clinicalNotes: data.clinicalNotes,
          responsibleDoctor: data.responsibleDoctor ?? user.username,
          priority: data.priority,
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

  async update(id: string, data: UpdatePatientDto, user: CurrentUser) {
    const existing = await this.prisma.patient.findFirstOrThrow({
      where: { id, ...(user.role === UserRole.BIDAN_PUSKESMAS ? { puskesmasId: user.puskesmasId ?? undefined } : {}) },
      include: { pregnancies: { where: { active: true }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    return this.prisma.$transaction(async (tx) => {
      const patient = await tx.patient.update({
        where: { id: existing.id },
        data: {
          fullName: data.fullName,
          nik: data.nik,
          dateOfBirth: toDate(data.dateOfBirth),
          phone: data.phone,
          address: data.address,
          bpjsNumber: data.bpjsNumber,
          emergencyName: data.emergencyName,
          emergencyPhone: data.emergencyPhone,
          bloodType: data.bloodType,
          allergy: data.allergy,
          chronicHistory: data.chronicHistory,
        },
      });

      const pregnancyData = {
        lmp: toDate(data.lmp),
        edd: toDate(data.edd),
        gestationalAge: data.gestationalAge,
        ancVisit: data.ancVisit,
        gravida: data.gravida,
        para: data.para,
        abortus: data.abortus,
        pregnancyType: data.pregnancyType,
        visitReason: data.visitReason,
        chiefComplaint: data.chiefComplaint,
        emergencySigns: data.emergencySigns as Prisma.InputJsonValue | undefined,
        vitalSigns: data.vitalSigns as Prisma.InputJsonValue | undefined,
        riskFactors: data.riskFactors as Prisma.InputJsonValue | undefined,
        routineMedication: data.routineMedication as Prisma.InputJsonValue | undefined,
        clinicalNotes: data.clinicalNotes,
        responsibleDoctor: data.responsibleDoctor,
        priority: data.priority,
        riskLevel: data.riskLevel,
      };
      const hasPregnancyChange = Object.values(pregnancyData).some((value) => value !== undefined);

      if (hasPregnancyChange) {
        const activePregnancy = existing.pregnancies[0];
        if (activePregnancy) {
          await tx.pregnancy.update({ where: { id: activePregnancy.id }, data: pregnancyData });
        } else {
          await tx.pregnancy.create({
            data: { patientId: existing.id, puskesmasId: existing.puskesmasId, ...pregnancyData, riskLevel: data.riskLevel ?? 'LOW' },
          });
        }
      }

      await tx.auditLog.create({ data: { userId: user.id, action: 'patient.update', entityType: 'Patient', entityId: existing.id } });
      return tx.patient.findUniqueOrThrow({ where: { id: patient.id }, include: { pregnancies: { orderBy: { createdAt: 'desc' } } } });
    });
  }

  async remove(id: string, user: CurrentUser) {
    const existing = await this.prisma.patient.findFirstOrThrow({
      where: { id, ...(user.role === UserRole.BIDAN_PUSKESMAS ? { puskesmasId: user.puskesmasId ?? undefined } : {}) },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.examination.deleteMany({ where: { patientId: existing.id } });
      await tx.patientQueue.deleteMany({ where: { patientId: existing.id } });
      await tx.pregnancy.deleteMany({ where: { patientId: existing.id } });
      await tx.patient.delete({ where: { id: existing.id } });
      await tx.auditLog.create({ data: { userId: user.id, action: 'patient.delete', entityType: 'Patient', entityId: existing.id } });
    });

    return { id: existing.id, deleted: true };
  }
}
