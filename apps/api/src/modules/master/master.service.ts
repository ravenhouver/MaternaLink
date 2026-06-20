import { ConflictException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MedicineCategory, MedicineType, Prisma, PuskesmasType, RainyAccess } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService, type AiDrug, type AiFacility } from '../ai/ai.service';
import { CreateObatDto, CreatePuskesmasDto, UpdateObatDto, UpdatePuskesmasDto } from './master.dto';

@Injectable()
export class MasterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MasterService.name);
  private syncTimer?: NodeJS.Timeout;
  private isSyncing = false;
  private lastSync: {
    status: 'never' | 'running' | 'success' | 'failed';
    mode?: 'auto' | 'manual';
    startedAt?: string;
    finishedAt?: string;
    puskesmas?: number;
    obat?: number;
    kondisi?: number;
    message?: string;
  } = { status: 'never' };

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  onModuleInit() {
    if (process.env.AI_MASTER_AUTO_SYNC === 'false') return;
    void this.syncAiMasterData({ mode: 'auto', reason: 'startup' }).catch((error) => this.logger.warn(`AI master startup sync failed: ${this.errorMessage(error)}`));

    const intervalMs = Number(process.env.AI_MASTER_SYNC_INTERVAL_MS ?? String(24 * 60 * 60 * 1000));
    if (Number.isFinite(intervalMs) && intervalMs > 0) {
      this.syncTimer = setInterval(() => {
        void this.syncAiMasterData({ mode: 'auto', reason: 'scheduled' }).catch((error) => this.logger.warn(`AI master scheduled sync failed: ${this.errorMessage(error)}`));
      }, intervalMs);
      this.syncTimer.unref?.();
    }
  }

  onModuleDestroy() {
    if (this.syncTimer) clearInterval(this.syncTimer);
  }

  listPuskesmas() {
    return this.prisma.puskesmas.findMany({ orderBy: { id: 'asc' } });
  }

  createPuskesmas(data: CreatePuskesmasDto) {
    return this.prisma.puskesmas.create({ data });
  }

  updatePuskesmas(id: string, data: UpdatePuskesmasDto) {
    return this.prisma.puskesmas.update({ where: { id }, data });
  }

  async removePuskesmas(id: string) {
    try {
      await this.prisma.puskesmas.delete({ where: { id } });
      return { id, deleted: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Puskesmas masih dipakai oleh data lain');
      }
      throw error;
    }
  }

  listObat() {
    return this.prisma.obat.findMany({ orderBy: { id: 'asc' } });
  }

  createObat(data: CreateObatDto) {
    return this.prisma.obat.create({ data });
  }

  updateObat(id: string, data: UpdateObatDto) {
    return this.prisma.obat.update({ where: { id }, data });
  }

  async removeObat(id: string) {
    try {
      await this.prisma.obat.delete({ where: { id } });
      return { id, deleted: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Obat masih dipakai oleh data lain');
      }
      throw error;
    }
  }

  listKondisi() {
    return this.prisma.kondisi.findMany({ orderBy: { id: 'asc' } });
  }

  listGejala() {
    return this.prisma.gejala.findMany({ orderBy: { id: 'asc' } });
  }

  async getAiMasterSyncStatus() {
    const latest = await this.prisma.auditLog.findFirst({
      where: { action: { in: ['master.ai.sync.success', 'master.ai.sync.failed'] } },
      orderBy: { createdAt: 'desc' },
    });
    return {
      ...this.lastSync,
      latestAudit: latest ? { action: latest.action, metadata: latest.metadata, createdAt: latest.createdAt } : null,
    };
  }

  async syncAiMasterData(options: { mode?: 'auto' | 'manual'; reason?: string } = {}) {
    if (this.isSyncing) return { ...this.lastSync, skipped: true, message: 'AI master data sync already running' };
    const mode = options.mode ?? 'manual';
    const startedAt = new Date();
    this.isSyncing = true;
    this.lastSync = { status: 'running', mode, startedAt: startedAt.toISOString() };

    try {
    const [facilities, drugs, conditions] = await Promise.all([this.ai.listFacilities(), this.ai.listDrugs(), this.ai.listConditions()]);

    await this.prisma.$transaction(async (tx) => {
      for (const facility of facilities) {
        const existing = await tx.puskesmas.findUnique({ where: { id: facility.facility_id } });
        await tx.puskesmas.upsert({
          where: { id: facility.facility_id },
          update: this.mapFacilityUpdate(facility, mode, existing),
          create: this.mapFacilityCreate(facility),
        });
      }

      for (const drug of drugs) {
        const existing = await tx.obat.findUnique({ where: { id: drug.drug_id } });
        await tx.obat.upsert({
          where: { id: drug.drug_id },
          update: this.mapDrugUpdate(drug, mode, existing),
          create: this.mapDrugCreate(drug),
        });
      }

      for (const condition of conditions) {
        await tx.kondisi.upsert({
          where: { id: condition.condition_id },
          update: {
            nama: condition.condition_name,
            deskripsi: this.conditionDescription(condition.prior_prevalence),
          },
          create: {
            id: condition.condition_id,
            nama: condition.condition_name,
            deskripsi: this.conditionDescription(condition.prior_prevalence),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'master.ai.sync.success',
          entityType: 'MasterData',
          metadata: { mode, reason: options.reason ?? null, puskesmas: facilities.length, obat: drugs.length, kondisi: conditions.length },
        },
      });
    });

    this.lastSync = { status: 'success', mode, startedAt: startedAt.toISOString(), finishedAt: new Date().toISOString(), puskesmas: facilities.length, obat: drugs.length, kondisi: conditions.length };
    return { puskesmas: facilities.length, obat: drugs.length, kondisi: conditions.length };
    } catch (error) {
      const message = this.errorMessage(error);
      this.lastSync = { status: 'failed', mode, startedAt: startedAt.toISOString(), finishedAt: new Date().toISOString(), message };
      await this.prisma.auditLog.create({
        data: { action: 'master.ai.sync.failed', entityType: 'MasterData', metadata: { mode, reason: options.reason ?? null, message } },
      }).catch(() => undefined);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private mapFacilityCreate(facility: AiFacility): Prisma.PuskesmasCreateInput {
    return {
      id: facility.facility_id,
      nama: facility.name,
      kecamatan: facility.district,
      kabupatenKota: facility.district,
      provinsi: facility.province ?? null,
      ketersediaanLab: Boolean(facility.has_lab),
      coldChainReady: Boolean(facility.has_cold_chain),
      leadTimeHari: facility.lead_time_days ?? null,
      skorAksesibilitas: this.accessibilityScore(facility.accessibility_score),
      rainyAccess: RainyAccess.AMAN,
      tipe: PuskesmasType.NON_RAWAT_INAP,
    };
  }

  private mapFacilityUpdate(facility: AiFacility, mode: 'auto' | 'manual', existing: { ketersediaanLab: boolean; coldChainReady: boolean; leadTimeHari: number | null; skorAksesibilitas: number } | null): Prisma.PuskesmasUpdateInput {
    if (mode === 'auto' && existing) {
      return {
        nama: facility.name,
        kecamatan: facility.district,
        kabupatenKota: facility.district,
        provinsi: facility.province ?? null,
        ketersediaanLab: existing.ketersediaanLab || Boolean(facility.has_lab),
        coldChainReady: existing.coldChainReady || Boolean(facility.has_cold_chain),
        leadTimeHari: existing.leadTimeHari ?? facility.lead_time_days ?? null,
        skorAksesibilitas: existing.skorAksesibilitas || this.accessibilityScore(facility.accessibility_score),
      };
    }
    return {
      nama: facility.name,
      kecamatan: facility.district,
      kabupatenKota: facility.district,
      provinsi: facility.province ?? null,
      ketersediaanLab: Boolean(facility.has_lab),
      coldChainReady: Boolean(facility.has_cold_chain),
      leadTimeHari: facility.lead_time_days ?? null,
      skorAksesibilitas: this.accessibilityScore(facility.accessibility_score),
      rainyAccess: RainyAccess.AMAN,
    };
  }

  private mapDrugCreate(drug: AiDrug): Prisma.ObatCreateInput {
    return {
      id: drug.drug_id,
      nama: drug.drug_name,
      kategori: this.medicineCategory(drug.category),
      perluColdChain: Boolean(drug.requires_cold_chain),
      satuan: drug.unit,
      dosisStandarHarian: drug.standard_daily_dose ?? null,
      durasiPengobatanHari: drug.treatment_duration_days == null ? null : Math.round(drug.treatment_duration_days),
      tipe: MedicineType.LAINNYA,
    };
  }

  private mapDrugUpdate(drug: AiDrug, mode: 'auto' | 'manual', existing: { satuan: string; dosisStandarHarian: number | null; durasiPengobatanHari: number | null } | null): Prisma.ObatUpdateInput {
    if (mode === 'auto' && existing) {
      return {
        nama: drug.drug_name,
        kategori: this.medicineCategory(drug.category),
        perluColdChain: Boolean(drug.requires_cold_chain),
        satuan: existing.satuan || drug.unit,
        dosisStandarHarian: existing.dosisStandarHarian ?? drug.standard_daily_dose ?? null,
        durasiPengobatanHari: existing.durasiPengobatanHari ?? (drug.treatment_duration_days == null ? null : Math.round(drug.treatment_duration_days)),
      };
    }
    return {
      nama: drug.drug_name,
      kategori: this.medicineCategory(drug.category),
      perluColdChain: Boolean(drug.requires_cold_chain),
      satuan: drug.unit,
      dosisStandarHarian: drug.standard_daily_dose ?? null,
      durasiPengobatanHari: drug.treatment_duration_days == null ? null : Math.round(drug.treatment_duration_days),
    };
  }

  private accessibilityScore(value?: number | null) {
    return Math.max(1, Math.min(3, Math.round(value ?? 2)));
  }

  private medicineCategory(value?: string | null) {
    const normalized = (value ?? '').toUpperCase();
    if (normalized in MedicineCategory) return normalized as MedicineCategory;
    if (normalized.includes('VAKSIN')) return MedicineCategory.VAKSIN;
    if (normalized.includes('ALAT')) return MedicineCategory.ALAT_KESEHATAN;
    return MedicineCategory.OBAT;
  }

  private conditionDescription(value?: number | null) {
    return value == null ? null : `Prior prevalence: ${value}`;
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'AI master data sync failed';
  }
}
