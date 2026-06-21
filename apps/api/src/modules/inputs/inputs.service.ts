import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CurrentUser } from '../../common/auth/current-user';
import { requiredScopedPuskesmasId, scopedPuskesmasId } from '../../common/auth/scope-utils';
import { PrismaService } from '../../prisma/prisma.service';
import { AnamnesisInputDto, DiagnosisInputDto, GejalaInputDto, KonteksInputDto, StokInputDto } from './inputs.dto';

const toDate = (value: string) => new Date(value);

function periodFilter(periode?: string) {
  return periode ? toDate(periode) : undefined;
}

@Injectable()
export class InputsService {
  constructor(private readonly prisma: PrismaService) {}

  listDiagnosis(user: CurrentUser, puskesmasId?: string, periode?: string) {
    return this.prisma.diagnosisPeriode.findMany({
      where: { puskesmasId: scopedPuskesmasId(user, puskesmasId), periode: periodFilter(periode) },
      include: { puskesmas: true, kondisi: true },
      orderBy: [{ periode: 'desc' }, { puskesmasId: 'asc' }],
    });
  }

  createDiagnosis(user: CurrentUser, data: DiagnosisInputDto) {
    const puskesmasId = requiredScopedPuskesmasId(user, data.puskesmasId);
    return this.prisma.diagnosisPeriode.upsert({
      where: { puskesmasId_kondisiId_periode: { puskesmasId, kondisiId: data.kondisiId, periode: toDate(data.periode) } },
      update: { jumlahKasus: data.jumlahKasus, source: data.source },
      create: { ...data, puskesmasId, periode: toDate(data.periode) },
    });
  }

  async removeDiagnosis(user: CurrentUser, id: number) {
    const existing = await this.prisma.diagnosisPeriode.findFirstOrThrow({ where: { id, puskesmasId: scopedPuskesmasId(user) } });
    await this.prisma.diagnosisPeriode.delete({ where: { id: existing.id } });
    return { id, deleted: true };
  }

  listGejala(user: CurrentUser, puskesmasId?: string, periode?: string) {
    return this.prisma.gejalaPeriode.findMany({
      where: { puskesmasId: scopedPuskesmasId(user, puskesmasId), periode: periodFilter(periode) },
      include: { puskesmas: true, gejala: true },
      orderBy: [{ periode: 'desc' }, { puskesmasId: 'asc' }],
    });
  }

  createGejala(user: CurrentUser, data: GejalaInputDto) {
    const puskesmasId = requiredScopedPuskesmasId(user, data.puskesmasId);
    return this.prisma.gejalaPeriode.upsert({
      where: { puskesmasId_gejalaId_periode: { puskesmasId, gejalaId: data.gejalaId, periode: toDate(data.periode) } },
      update: { jumlah: data.jumlah },
      create: { ...data, puskesmasId, periode: toDate(data.periode) },
    });
  }

  async removeGejala(user: CurrentUser, id: number) {
    const existing = await this.prisma.gejalaPeriode.findFirstOrThrow({ where: { id, puskesmasId: scopedPuskesmasId(user) } });
    await this.prisma.gejalaPeriode.delete({ where: { id: existing.id } });
    return { id, deleted: true };
  }

  listKonteks(user: CurrentUser, puskesmasId?: string, periode?: string) {
    return this.prisma.konteksPeriode.findMany({
      where: { puskesmasId: scopedPuskesmasId(user, puskesmasId), periode: periodFilter(periode) },
      include: { puskesmas: true },
      orderBy: [{ periode: 'desc' }, { puskesmasId: 'asc' }],
    });
  }

  createKonteks(user: CurrentUser, data: KonteksInputDto) {
    const puskesmasId = requiredScopedPuskesmasId(user, data.puskesmasId);
    return this.prisma.konteksPeriode.upsert({
      where: { puskesmasId_periode: { puskesmasId, periode: toDate(data.periode) } },
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
      create: { ...data, puskesmasId, periode: toDate(data.periode), statusKlb: data.statusKlb ?? false },
    });
  }

  async removeKonteks(user: CurrentUser, id: number) {
    const existing = await this.prisma.konteksPeriode.findFirstOrThrow({ where: { id, puskesmasId: scopedPuskesmasId(user) } });
    await this.prisma.konteksPeriode.delete({ where: { id: existing.id } });
    return { id, deleted: true };
  }

  listStok(user: CurrentUser, puskesmasId?: string, periode?: string) {
    return this.prisma.stokPuskesmas.findMany({
      where: { puskesmasId: scopedPuskesmasId(user, puskesmasId), periode: periodFilter(periode) },
      include: { puskesmas: true, obat: true },
      orderBy: [{ periode: 'desc' }, { puskesmasId: 'asc' }],
    });
  }

  createStok(user: CurrentUser, data: StokInputDto) {
    const puskesmasId = requiredScopedPuskesmasId(user, data.puskesmasId);
    return this.prisma.stokPuskesmas.upsert({
      where: { puskesmasId_obatId_periode: { puskesmasId, obatId: data.obatId, periode: toDate(data.periode) } },
      update: { stokAwal: data.stokAwal, konsumsiPeriode: data.konsumsiPeriode, stokSaatIni: data.stokSaatIni },
      create: { ...data, puskesmasId, periode: toDate(data.periode) },
    });
  }

  async removeStok(user: CurrentUser, id: number) {
    const existing = await this.prisma.stokPuskesmas.findFirstOrThrow({ where: { id, puskesmasId: scopedPuskesmasId(user) } });
    await this.prisma.stokPuskesmas.delete({ where: { id: existing.id } });
    return { id, deleted: true };
  }

  listAnamnesis(user: CurrentUser, puskesmasId?: string, periode?: string) {
    return this.prisma.anamnesisRaw.findMany({
      where: { puskesmasId: scopedPuskesmasId(user, puskesmasId), periode: periodFilter(periode) },
      include: { puskesmas: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  createAnamnesis(user: CurrentUser, data: AnamnesisInputDto) {
    const puskesmasId = requiredScopedPuskesmasId(user, data.puskesmasId);
    return this.prisma.anamnesisRaw.create({
      data: {
        puskesmasId,
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

  async removeAnamnesis(user: CurrentUser, id: number) {
    const existing = await this.prisma.anamnesisRaw.findFirstOrThrow({ where: { id, puskesmasId: scopedPuskesmasId(user) } });
    await this.prisma.anamnesisRaw.delete({ where: { id: existing.id } });
    return { id, deleted: true };
  }
}
