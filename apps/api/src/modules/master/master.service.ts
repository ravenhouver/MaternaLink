import { ConflictException, Injectable } from '@nestjs/common';
import { MedicineCategory, MedicineType, Prisma, PuskesmasType, RainyAccess } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService, type AiDrug, type AiFacility } from '../ai/ai.service';
import { CreateObatDto, CreatePuskesmasDto, UpdateObatDto, UpdatePuskesmasDto } from './master.dto';

@Injectable()
export class MasterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

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

  async syncAiMasterData() {
    const [facilities, drugs, conditions] = await Promise.all([this.ai.listFacilities(), this.ai.listDrugs(), this.ai.listConditions()]);

    await this.prisma.$transaction(async (tx) => {
      for (const facility of facilities) {
        await tx.puskesmas.upsert({
          where: { id: facility.facility_id },
          update: this.mapFacilityUpdate(facility),
          create: this.mapFacilityCreate(facility),
        });
      }

      for (const drug of drugs) {
        await tx.obat.upsert({
          where: { id: drug.drug_id },
          update: this.mapDrugUpdate(drug),
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
    });

    return { puskesmas: facilities.length, obat: drugs.length, kondisi: conditions.length };
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

  private mapFacilityUpdate(facility: AiFacility): Prisma.PuskesmasUpdateInput {
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

  private mapDrugUpdate(drug: AiDrug): Prisma.ObatUpdateInput {
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
}
