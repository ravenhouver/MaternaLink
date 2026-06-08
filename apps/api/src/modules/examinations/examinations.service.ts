import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import type { CurrentUser } from '../../common/auth/current-user';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExaminationDto } from './examinations.dto';

const DEMO_PERIOD = new Date('2026-06-01');

@Injectable()
export class ExaminationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateExaminationDto, user: CurrentUser) {
    return this.prisma.$transaction(async (tx) => {
      const pregnancy = await tx.pregnancy.findUniqueOrThrow({ where: { id: data.pregnancyId } });
      const puskesmasId = user.role === UserRole.BIDAN_PUSKESMAS ? user.puskesmasId ?? pregnancy.puskesmasId : pregnancy.puskesmasId;
      const diagnosis = data.diagnosis ?? [];
      const symptoms = data.symptoms ?? [];

      const examination = await tx.examination.create({
        data: {
          patientId: data.patientId,
          pregnancyId: data.pregnancyId,
          queueId: data.queueId,
          puskesmasId,
          source: data.source ?? 'MANUAL',
          complaint: data.complaint,
          gestationalAge: data.gestationalAge,
          ancVisit: data.ancVisit,
          diagnosis: diagnosis as unknown as Prisma.InputJsonValue,
          symptoms: symptoms as unknown as Prisma.InputJsonValue,
          medication: (data.medication ?? []) as unknown as Prisma.InputJsonValue,
          notes: data.notes,
          riskSummary: { riskLevel: pregnancy.riskLevel } as Prisma.InputJsonValue,
          createdById: user.id,
        },
      });

      for (const item of diagnosis) {
        await tx.diagnosisPeriode.upsert({
          where: { puskesmasId_kondisiId_periode: { puskesmasId, kondisiId: item.kondisiId, periode: DEMO_PERIOD } },
          update: { jumlahKasus: item.jumlahKasus, source: 'BIDAN' },
          create: { puskesmasId, kondisiId: item.kondisiId, periode: DEMO_PERIOD, jumlahKasus: item.jumlahKasus, source: 'BIDAN' },
        });
      }

      for (const item of symptoms) {
        await tx.gejalaPeriode.upsert({
          where: { puskesmasId_gejalaId_periode: { puskesmasId, gejalaId: item.gejalaId, periode: DEMO_PERIOD } },
          update: { jumlah: item.jumlah },
          create: { puskesmasId, gejalaId: item.gejalaId, periode: DEMO_PERIOD, jumlah: item.jumlah },
        });
      }

      if (data.complaint) {
        await tx.anamnesisRaw.create({
          data: {
            puskesmasId,
            periode: DEMO_PERIOD,
            transkrip: data.complaint,
            gejalaExtracted: symptoms as unknown as Prisma.InputJsonValue,
            gejalaValidated: symptoms as unknown as Prisma.InputJsonValue,
            extractionModel: data.source === 'VOICE_TRANSCRIPT_AI' ? 'future-fastapi-ai' : 'rule-based-fallback',
          },
        });
      }

      if (data.queueId) {
        await tx.patientQueue.update({ where: { id: data.queueId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      }

      await tx.auditLog.create({
        data: { userId: user.id, action: 'examination.create', entityType: 'Examination', entityId: examination.id },
      });

      return examination;
    });
  }

  get(id: string) {
    return this.prisma.examination.findUniqueOrThrow({ where: { id } });
  }
}
