import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import type { CurrentUser } from '../../common/auth/current-user';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AiExaminationDraftDto, CreateExaminationDto, UpdateExaminationDto } from './examinations.dto';

function currentPeriod() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function normalizeMedication(data: CreateExaminationDto['medication']) {
  return (data ?? [])
    .filter((item) => item.obatId)
    .map((item) => ({
      obatId: item.obatId,
      quantity: item.quantity,
      unit: item.unit ?? null,
      duration: item.duration ?? null,
      durationUnit: item.durationUnit ?? null,
      frequency: item.frequency ?? null,
      frequencyUnit: item.frequencyUnit ?? null,
    }));
}

@Injectable()
export class ExaminationsService {
  constructor(private readonly prisma: PrismaService, private readonly ai: AiService) {}

  async createAiDraft(data: AiExaminationDraftDto, user: CurrentUser) {
    if (!user.puskesmasId) return { symptomIds: [], diagnosisIds: [], needsReview: true, model: 'unavailable', message: 'Current user is not assigned to a puskesmas' };
    const period = data.period?.slice(0, 10) ?? currentPeriod().toISOString().slice(0, 10);
    const extraction = await this.ai.extractSymptoms({
      period,
      records: [{ record_id: `DRAFT-${Date.now()}`, facility_id: user.puskesmasId, transcript: data.complaint }],
    });
    const result = extraction.extraction_results[0];
    const symptomIds = this.parseSymptomIds(result?.validated_symptoms || result?.extracted_symptoms);
    const diagnosisIds = extraction.condition_estimates
      .filter((item) => item.estimated_total_cases > 0)
      .sort((a, b) => b.estimated_total_cases - a.estimated_total_cases)
      .map((item) => item.condition_id)
      .slice(0, 3);
    return {
      symptomIds,
      diagnosisIds,
      needsReview: Boolean(result?.hitl_flag || (result?.min_confidence ?? 1) < 0.7),
      minConfidence: result?.min_confidence ?? null,
      model: result?.extraction_model ?? 'hosted-ai-layer0',
    };
  }

  create(data: CreateExaminationDto, user: CurrentUser) {
    return this.prisma.$transaction(async (tx) => {
      const pregnancy = await tx.pregnancy.findUniqueOrThrow({ where: { id: data.pregnancyId } });
      const puskesmasId = user.role === UserRole.BIDAN_PUSKESMAS ? user.puskesmasId ?? pregnancy.puskesmasId : pregnancy.puskesmasId;
      const diagnosis = data.diagnosis ?? [];
      const symptoms = data.symptoms ?? [];
      const medication = normalizeMedication(data.medication);
      const period = currentPeriod();

      const examination = await tx.examination.create({
        data: {
          patientId: data.patientId,
          pregnancyId: data.pregnancyId,
          queueId: data.queueId,
          puskesmasId,
          source: data.source ?? 'MANUAL',
          complaint: data.complaint,
          vitalSigns: data.vitalSigns as Prisma.InputJsonValue | undefined,
          gestationalAge: data.gestationalAge,
          ancVisit: data.ancVisit,
          diagnosis: diagnosis as unknown as Prisma.InputJsonValue,
          symptoms: symptoms as unknown as Prisma.InputJsonValue,
          medication: medication as unknown as Prisma.InputJsonValue,
          notes: data.notes,
          riskSummary: (data.riskSummary ?? { riskLevel: pregnancy.riskLevel }) as Prisma.InputJsonValue,
          createdById: user.id,
        },
      });

      for (const item of diagnosis) {
        await tx.diagnosisPeriode.upsert({
          where: { puskesmasId_kondisiId_periode: { puskesmasId, kondisiId: item.kondisiId, periode: period } },
          update: { jumlahKasus: item.jumlahKasus, source: 'BIDAN' },
          create: { puskesmasId, kondisiId: item.kondisiId, periode: period, jumlahKasus: item.jumlahKasus, source: 'BIDAN' },
        });
      }

      for (const item of symptoms) {
        await tx.gejalaPeriode.upsert({
          where: { puskesmasId_gejalaId_periode: { puskesmasId, gejalaId: item.gejalaId, periode: period } },
          update: { jumlah: item.jumlah },
          create: { puskesmasId, gejalaId: item.gejalaId, periode: period, jumlah: item.jumlah },
        });
      }

      if (data.complaint) {
        await tx.anamnesisRaw.create({
          data: {
            puskesmasId,
            periode: period,
            transkrip: data.complaint,
            gejalaExtracted: symptoms as unknown as Prisma.InputJsonValue,
            gejalaValidated: symptoms as unknown as Prisma.InputJsonValue,
            extractionModel: data.source === 'VOICE_TRANSCRIPT_AI' ? 'speech-stt-service' : 'manual-entry',
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

  get(id: string, user: CurrentUser) {
    return this.prisma.examination.findFirstOrThrow({
      where: { id, ...(user.role === UserRole.BIDAN_PUSKESMAS ? { puskesmasId: user.puskesmasId ?? undefined } : {}) },
      include: { patient: true, pregnancy: true, queue: true },
    });
  }

  list(user: CurrentUser, filters: { patientId?: string; puskesmasId?: string }) {
    const puskesmasId = user.role === UserRole.BIDAN_PUSKESMAS ? user.puskesmasId ?? undefined : filters.puskesmasId;
    return this.prisma.examination.findMany({
      where: { puskesmasId, patientId: filters.patientId },
      include: { patient: true, pregnancy: true, queue: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: UpdateExaminationDto, user: CurrentUser) {
    const existing = await this.prisma.examination.findFirstOrThrow({
      where: { id, ...(user.role === UserRole.BIDAN_PUSKESMAS ? { puskesmasId: user.puskesmasId ?? undefined } : {}) },
    });

    const diagnosis = data.diagnosis as unknown as Prisma.InputJsonValue | undefined;
    const symptoms = data.symptoms as unknown as Prisma.InputJsonValue | undefined;
    const medication = data.medication ? normalizeMedication(data.medication) as unknown as Prisma.InputJsonValue : undefined;

    const updated = await this.prisma.examination.update({
      where: { id: existing.id },
      data: {
        source: data.source,
        complaint: data.complaint,
        gestationalAge: data.gestationalAge,
        vitalSigns: data.vitalSigns as Prisma.InputJsonValue | undefined,
        ancVisit: data.ancVisit,
        diagnosis,
        symptoms,
        medication,
        riskSummary: data.riskSummary as Prisma.InputJsonValue | undefined,
        notes: data.notes,
      },
      include: { patient: true, pregnancy: true, queue: true },
    });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'examination.update', entityType: 'Examination', entityId: existing.id } });
    return updated;
  }

  async remove(id: string, user: CurrentUser) {
    const existing = await this.prisma.examination.findFirstOrThrow({
      where: { id, ...(user.role === UserRole.BIDAN_PUSKESMAS ? { puskesmasId: user.puskesmasId ?? undefined } : {}) },
    });
    await this.prisma.examination.delete({ where: { id: existing.id } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'examination.delete', entityType: 'Examination', entityId: existing.id } });
    return { id: existing.id, deleted: true };
  }

  private parseSymptomIds(value?: string | null) {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.flatMap((item) => {
          if (typeof item === 'string') return [item];
          if (item && typeof item === 'object' && 'symptom_id' in item) return [String((item as { symptom_id: unknown }).symptom_id)];
          return [];
        });
      }
    } catch {
      return [];
    }
    return [];
  }
}
