import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RunForecastDto } from './forecast.dto';

const toDate = (value: string) => new Date(value);

@Injectable()
export class ForecastService {
  constructor(private readonly prisma: PrismaService) {}

  async run(data: RunForecastDto) {
    const periode = toDate(data.periode);
    const stocks = await this.prisma.stokPuskesmas.findMany({
      where: { puskesmasId: data.puskesmasId, periode },
      include: { obat: { include: { kondisiObat: true } } },
      orderBy: { obatId: 'asc' },
    });
    if (stocks.length === 0) throw new NotFoundException('No stock input found for puskesmas and periode');

    const context = await this.prisma.konteksPeriode.findUnique({
      where: { puskesmasId_periode: { puskesmasId: data.puskesmasId, periode } },
    });
    const bufferPersen = context?.accessScore === 1 ? 0.3 : 0.2;

    const run = await this.prisma.forecastRun.create({
      data: {
        puskesmasId: data.puskesmasId,
        periode,
        status: 'COMPLETED',
        confidence: 'MEDIUM',
        prediksi: {
          create: stocks.map((stock) => {
            const kebutuhanObat = Math.max(30, stock.konsumsiPeriode);
            return {
              obatId: stock.obatId,
              kondisiId: stock.obat.kondisiObat[0]?.kondisiId,
              kebutuhanObat,
              bufferPersen,
              totalRekomendasi: Math.ceil(kebutuhanObat * (1 + bufferPersen)),
              stokSaatIni: stock.stokSaatIni,
              konsumsiPeriode: stock.konsumsiPeriode,
              confidence: 'MEDIUM',
            };
          }),
        },
      },
      include: { prediksi: { orderBy: { obatId: 'asc' } } },
    });

    return run;
  }

  listRuns() {
    return this.prisma.forecastRun.findMany({ include: { prediksi: true }, orderBy: { createdAt: 'desc' } });
  }

  getResults(id: number) {
    return this.prisma.forecastRun.findUniqueOrThrow({ where: { id }, include: { prediksi: { orderBy: { obatId: 'asc' } } } });
  }
}
