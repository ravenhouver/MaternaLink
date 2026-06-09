import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AnamnesisInputDto, DiagnosisInputDto, GejalaInputDto, KonteksInputDto, StokInputDto } from './inputs.dto';

const toDate = (value: string) => new Date(value);

function periodFilter(periode?: string) {
  return periode ? toDate(periode) : undefined;
}

@Injectable()
export class InputsService {
  constructor(private readonly prisma: PrismaService) {}

  listDiagnosis(puskesmasId?: string, periode?: string) {
    return this.prisma.diagnosisPeriode.findMany({
      where: { puskesmasId, periode: periodFilter(periode) },
      include: { puskesmas: true, kondisi: true },
      orderBy: [{ periode: 'desc' }, { puskesmasId: 'asc' }],
    });
  }

  createDiagnosis(data: DiagnosisInputDto) {
    return this.prisma.diagnosisPeriode.upsert({
      where: { puskesmasId_kondisiId_periode: { puskesmasId: data.puskesmasId, kondisiId: data.kondisiId, periode: toDate(data.periode) } },
      update: { jumlahKasus: data.jumlahKasus, source: data.source },
      create: { ...data, periode: toDate(data.periode) },
    });
  }

  async removeDiagnosis(id: number) {
    await this.prisma.diagnosisPeriode.delete({ where: { id } });
    return { id, deleted: true };
  }

  listGejala(puskesmasId?: string, periode?: string) {
    return this.prisma.gejalaPeriode.findMany({
      where: { puskesmasId, periode: periodFilter(periode) },
      include: { puskesmas: true, gejala: true },
      orderBy: [{ periode: 'desc' }, { puskesmasId: 'asc' }],
    });
  }

  createGejala(data: GejalaInputDto) {
    return this.prisma.gejalaPeriode.upsert({
      where: { puskesmasId_gejalaId_periode: { puskesmasId: data.puskesmasId, gejalaId: data.gejalaId, periode: toDate(data.periode) } },
      update: { jumlah: data.jumlah },
      create: { ...data, periode: toDate(data.periode) },
    });
  }

  async removeGejala(id: number) {
    await this.prisma.gejalaPeriode.delete({ where: { id } });
    return { id, deleted: true };
  }

  listKonteks(puskesmasId?: string, periode?: string) {
    return this.prisma.konteksPeriode.findMany({
      where: { puskesmasId, periode: periodFilter(periode) },
      include: { puskesmas: true },
      orderBy: [{ periode: 'desc' }, { puskesmasId: 'asc' }],
    });
  }

  createKonteks(data: KonteksInputDto) {
    return this.prisma.konteksPeriode.upsert({
      where: { puskesmasId_periode: { puskesmasId: data.puskesmasId, periode: toDate(data.periode) } },
      update: {
        season: data.season,
        accessScore: data.accessScore,
        rainyAccess: data.rainyAccess,
        routeDisrupted: data.routeDisrupted,
        jumlahBumilT1: data.jumlahBumilT1,
        jumlahBumilT2: data.jumlahBumilT2,
        jumlahBumilT3: data.jumlahBumilT3,
        statusKlb: data.statusKlb ?? false,
        riwayatStockout6Bln: data.riwayatStockout6Bln,
      },
      create: { ...data, periode: toDate(data.periode), statusKlb: data.statusKlb ?? false },
    });
  }

  async removeKonteks(id: number) {
    await this.prisma.konteksPeriode.delete({ where: { id } });
    return { id, deleted: true };
  }

  listStok(puskesmasId?: string, periode?: string) {
    return this.prisma.stokPuskesmas.findMany({
      where: { puskesmasId, periode: periodFilter(periode) },
      include: { puskesmas: true, obat: true },
      orderBy: [{ periode: 'desc' }, { puskesmasId: 'asc' }],
    });
  }

  createStok(data: StokInputDto) {
    return this.prisma.stokPuskesmas.upsert({
      where: { puskesmasId_obatId_periode: { puskesmasId: data.puskesmasId, obatId: data.obatId, periode: toDate(data.periode) } },
      update: { stokAwal: data.stokAwal, konsumsiPeriode: data.konsumsiPeriode, stokSaatIni: data.stokSaatIni },
      create: { ...data, periode: toDate(data.periode) },
    });
  }

  async removeStok(id: number) {
    await this.prisma.stokPuskesmas.delete({ where: { id } });
    return { id, deleted: true };
  }

  listAnamnesis(puskesmasId?: string, periode?: string) {
    return this.prisma.anamnesisRaw.findMany({
      where: { puskesmasId, periode: periodFilter(periode) },
      include: { puskesmas: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  createAnamnesis(data: AnamnesisInputDto) {
    return this.prisma.anamnesisRaw.create({
      data: {
        puskesmasId: data.puskesmasId,
        periode: toDate(data.periode),
        audioPath: data.audioPath,
        transkrip: data.transkrip,
        gejalaExtracted: data.gejalaExtracted as Prisma.InputJsonValue | undefined,
        gejalaValidated: data.gejalaValidated as Prisma.InputJsonValue | undefined,
        sttModel: data.sttModel,
        extractionModel: data.extractionModel,
      },
    });
  }

  async removeAnamnesis(id: number) {
    await this.prisma.anamnesisRaw.delete({ where: { id } });
    return { id, deleted: true };
  }
}
