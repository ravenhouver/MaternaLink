import type { AppIconName } from '@/components/ui/app-icon';

export type CalendarEventType = 'anc' | 'delivery' | 'risk';

export type CalendarDay = {
  date: string;
  day: number;
  muted?: boolean;
  shaded?: boolean;
  selected?: boolean;
  events?: CalendarEventType[];
};

export const summaryItems = [
  { value: '5', label: 'Persalinan Bulan Ini', icon: 'heart', tone: 'blueSoft' },
  { value: '12', label: 'Kunjungan ANC', icon: 'clipboard', tone: 'blue' },
  { value: '3', label: 'Pasien Risiko Tinggi', icon: 'alert', tone: 'red' },
] satisfies Array<{ value: string; label: string; icon: AppIconName; tone: 'blueSoft' | 'blue' | 'red' }>;

export const weekdays = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

export const calendarDays: CalendarDay[] = [
  { date: '2024-09-28', day: 28, muted: true, shaded: true },
  { date: '2024-09-29', day: 29, muted: true, shaded: true },
  { date: '2024-09-30', day: 30, muted: true, shaded: true },
  { date: '2024-10-01', day: 1, events: ['anc'] },
  { date: '2024-10-02', day: 2 },
  { date: '2024-10-03', day: 3, shaded: true, events: ['delivery'] },
  { date: '2024-10-04', day: 4 },
  { date: '2024-10-05', day: 5 },
  { date: '2024-10-06', day: 6, shaded: true, events: ['risk'] },
  { date: '2024-10-07', day: 7 },
  { date: '2024-10-08', day: 8 },
  { date: '2024-10-09', day: 9, selected: true, shaded: true, events: ['anc', 'risk'] },
  { date: '2024-10-10', day: 10 },
  { date: '2024-10-11', day: 11, events: ['anc'] },
  { date: '2024-10-12', day: 12 },
  { date: '2024-10-13', day: 13 },
  { date: '2024-10-14', day: 14 },
  { date: '2024-10-15', day: 15, shaded: true },
  { date: '2024-10-16', day: 16 },
  { date: '2024-10-17', day: 17 },
  { date: '2024-10-18', day: 18 },
  { date: '2024-10-19', day: 19 },
  { date: '2024-10-20', day: 20 },
  { date: '2024-10-21', day: 21 },
  { date: '2024-10-22', day: 22 },
  { date: '2024-10-23', day: 23 },
  { date: '2024-10-24', day: 24 },
  { date: '2024-10-25', day: 25 },
  { date: '2024-10-26', day: 26 },
  { date: '2024-10-27', day: 27 },
  { date: '2024-10-28', day: 28 },
  { date: '2024-10-29', day: 29 },
  { date: '2024-10-30', day: 30 },
  { date: '2024-10-31', day: 31 },
  { date: '2024-11-01', day: 1, muted: true, shaded: true },
];

export const eventLabels: Record<CalendarEventType, string> = {
  anc: 'ANC',
  delivery: 'PERSALINAN',
  risk: 'RISIKO TINGGI',
};
