import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AnamnesisInputDto, DiagnosisInputDto, GejalaInputDto, KonteksInputDto, StokInputDto } from './inputs.dto';

const toDate = (value: string) => new Date(value);

@Injectable()
export class InputsService {
  constructor(private readonly prisma: PrismaService) {}

  createDiagnosis(data: DiagnosisInputDto) {
    return this.prisma.diagnosisPeriode.upsert({
      where: { puskesmasId_kondisiId_periode: { puskesmasId: data.puskesmasId, kondisiId: data.kondisiId, periode: toDate(data.periode) } },
      update: { jumlahKasus: data.jumlahKasus, source: data.source },
      create: { ...data, periode: toDate(data.periode) },
    });
  }

  createGejala(data: GejalaInputDto) {
    return this.prisma.gejalaPeriode.upsert({
      where: { puskesmasId_gejalaId_periode: { puskesmasId: data.puskesmasId, gejalaId: data.gejalaId, periode: toDate(data.periode) } },
      update: { jumlah: data.jumlah },
      create: { ...data, periode: toDate(data.periode) },
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

  createStok(data: StokInputDto) {
    return this.prisma.stokPuskesmas.upsert({
      where: { puskesmasId_obatId_periode: { puskesmasId: data.puskesmasId, obatId: data.obatId, periode: toDate(data.periode) } },
      update: { stokAwal: data.stokAwal, konsumsiPeriode: data.konsumsiPeriode, stokSaatIni: data.stokSaatIni },
      create: { ...data, periode: toDate(data.periode) },
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
}
