import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateLplpoDto } from './lplpo.dto';

const toDate = (value: string) => new Date(value);

@Injectable()
export class LplpoService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(data: GenerateLplpoDto) {
    const periode = toDate(data.periode);
    const run = await this.prisma.forecastRun.findFirst({
      where: { puskesmasId: data.puskesmasId, periode },
      include: { prediksi: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!run) throw new NotFoundException('Forecast run not found for LPLPO generation');

    const rows = [];
    for (const prediction of run.prediksi) {
      const daysOfStock = prediction.konsumsiPeriode > 0 ? prediction.stokSaatIni / (prediction.konsumsiPeriode / 30) : null;
      rows.push(
        await this.prisma.lplpoPrediktif.upsert({
          where: { prediksiStokId: prediction.id },
          update: {
            jumlahDiminta: Math.max(0, prediction.totalRekomendasi - prediction.stokSaatIni),
            daysOfStock,
          },
          create: {
            prediksiStokId: prediction.id,
            puskesmasId: data.puskesmasId,
            obatId: prediction.obatId,
            periode,
            jumlahDiminta: Math.max(0, prediction.totalRekomendasi - prediction.stokSaatIni),
            daysOfStock,
          },
        }),
      );
    }
    return rows;
  }

  list(puskesmasId?: string, periode?: string) {
    return this.prisma.lplpoPrediktif.findMany({
      where: { puskesmasId, periode: periode ? toDate(periode) : undefined },
      include: { obat: true, puskesmas: true },
      orderBy: { id: 'asc' },
    });
  }
}
