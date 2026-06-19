import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { CurrentUser } from '../../common/auth/current-user';
import { PrismaService } from '../../prisma/prisma.service';
import { ForecastCalendarQueryDto, RunForecastDto } from './forecast.dto';

const toDate = (value: string) => new Date(value);
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: Date, days: number) => {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};
const monthStart = (month?: string) => {
  const value = month ?? new Date().toISOString().slice(0, 7);
  return new Date(`${value}-01T00:00:00.000Z`);
};
const sameMonthKey = (key: string, month: Date) => key.startsWith(`${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`);

type CalendarEventType = 'anc' | 'delivery' | 'risk';
type CalendarEvent = {
  id: string;
  date: string;
  type: CalendarEventType;
  title: string;
  label: string;
  time?: string;
  priority?: boolean;
  prepItems?: string[];
};

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

  async getCalendar(query: ForecastCalendarQueryDto, user: CurrentUser) {
    const month = monthStart(query.month);
    const firstDay = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
    const startOffset = (firstDay.getUTCDay() + 6) % 7;
    const gridStart = addDays(firstDay, -startOffset);
    const requestedSelected = query.selectedDate ?? dateKey(new Date());
    const puskesmasId = user.role === UserRole.BIDAN_PUSKESMAS ? user.puskesmasId : undefined;

    const pregnancies = await this.prisma.pregnancy.findMany({
      where: { active: true, ...(puskesmasId ? { puskesmasId } : {}) },
      include: { patient: true },
      orderBy: [{ riskLevel: 'desc' }, { updatedAt: 'desc' }],
    });

    const forecastRun = await this.prisma.forecastRun.findFirst({
      where: { periode: firstDay, ...(puskesmasId ? { puskesmasId } : {}) },
      include: { prediksi: { include: { obat: true }, orderBy: { totalRekomendasi: 'desc' }, take: 3 } },
      orderBy: { createdAt: 'desc' },
    });
    const prepItems = forecastRun?.prediksi.map((row) => row.obat.nama).filter(Boolean) ?? ['Oksitosin', 'Spuit', 'Benang Jahit'];

    const events: CalendarEvent[] = [];
    for (const pregnancy of pregnancies) {
      if (pregnancy.edd) {
        const deliveryDate = dateKey(pregnancy.edd);
        events.push({
          id: `${pregnancy.id}-delivery`,
          date: deliveryDate,
          type: 'delivery',
          title: pregnancy.patient.fullName,
          label: 'PERSALINAN (HPL)',
          priority: pregnancy.priority === 'UTAMA' || pregnancy.riskLevel === 'HIGH',
          prepItems,
        });

        const ancDate = dateKey(addDays(pregnancy.edd, -28));
        events.push({
          id: `${pregnancy.id}-anc`,
          date: ancDate,
          type: 'anc',
          title: pregnancy.patient.fullName,
          label: pregnancy.ancVisit ? `ANC - ${pregnancy.ancVisit}` : 'ANC FOLLOW UP',
          time: 'Pukul 09:00 WIB',
        });

        if (pregnancy.riskLevel === 'HIGH') {
          const riskDate = dateKey(addDays(pregnancy.edd, -14));
          events.push({
            id: `${pregnancy.id}-risk`,
            date: riskDate,
            type: 'risk',
            title: pregnancy.patient.fullName,
            label: 'KONTROL RISIKO TINGGI',
            time: 'Pukul 14:00 WIB',
            priority: true,
          });
        }
      } else if (pregnancy.riskLevel === 'HIGH' && sameMonthKey(requestedSelected, month)) {
        events.push({
          id: `${pregnancy.id}-risk`,
          date: requestedSelected,
          type: 'risk',
          title: pregnancy.patient.fullName,
          label: 'KONTROL RISIKO TINGGI',
          time: 'Pukul 14:00 WIB',
          priority: true,
        });
      }
    }

    const selectedDate = sameMonthKey(requestedSelected, month) ? requestedSelected : events.find((event) => sameMonthKey(event.date, month))?.date ?? requestedSelected;
    const days = Array.from({ length: 35 }, (_, index) => {
      const date = addDays(gridStart, index);
      const key = dateKey(date);
      const dayEvents = events.filter((event) => event.date === key).map((event) => event.type);
      return {
        date: key,
        day: date.getUTCDate(),
        muted: date.getUTCMonth() !== month.getUTCMonth(),
        shaded: dayEvents.length > 0 || date.getUTCMonth() !== month.getUTCMonth(),
        selected: key === selectedDate,
        events: Array.from(new Set(dayEvents)),
      };
    });

    const selectedEvents = events.filter((event) => event.date === selectedDate);
    return {
      month: `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`,
      selectedDate,
      summary: {
        deliveriesThisMonth: events.filter((event) => event.type === 'delivery' && sameMonthKey(event.date, month)).length,
        ancThisMonth: events.filter((event) => event.type === 'anc' && sameMonthKey(event.date, month)).length,
        highRiskPatients: pregnancies.filter((pregnancy) => pregnancy.riskLevel === 'HIGH').length,
      },
      days,
      events: selectedEvents,
      note: prepItems.length > 0 ? `Pastikan stok ${prepItems[0]} tersedia untuk pekan depan.` : 'Pastikan stok klinis tersedia untuk pekan depan.',
    };
  }

  listRuns() {
    return this.prisma.forecastRun.findMany({ include: { prediksi: true }, orderBy: { createdAt: 'desc' } });
  }

  getResults(id: number) {
    return this.prisma.forecastRun.findUniqueOrThrow({ where: { id }, include: { prediksi: { orderBy: { obatId: 'asc' } } } });
  }
}
