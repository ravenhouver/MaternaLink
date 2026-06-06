export type CalendarEventType = 'anc' | 'delivery' | 'risk';

export type CalendarDay = {
  day: number;
  muted?: boolean;
  shaded?: boolean;
  selected?: boolean;
  events?: CalendarEventType[];
};

export const summaryItems = [
  { value: '5', label: 'Persalinan Bulan Ini', icon: 'summary-delivery.svg', tone: 'blueSoft' },
  { value: '12', label: 'Kunjungan ANC', icon: 'summary-anc.svg', tone: 'blue' },
  { value: '3', label: 'Pasien Risiko Tinggi', icon: 'summary-risk.svg', tone: 'red' },
] as const;

export const weekdays = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

export const calendarDays: CalendarDay[] = [
  { day: 28, muted: true, shaded: true },
  { day: 29, muted: true, shaded: true },
  { day: 30, muted: true, shaded: true },
  { day: 1, events: ['anc'] },
  { day: 2 },
  { day: 3, shaded: true, events: ['delivery'] },
  { day: 4 },
  { day: 5 },
  { day: 6, shaded: true, events: ['risk'] },
  { day: 7 },
  { day: 8 },
  { day: 9, selected: true, shaded: true, events: ['anc', 'risk'] },
  { day: 10 },
  { day: 11, events: ['anc'] },
  { day: 12 },
  { day: 13 },
  { day: 14 },
  { day: 15, shaded: true },
  { day: 16 },
  { day: 17 },
  { day: 18 },
  { day: 19 },
  { day: 20 },
  { day: 21 },
  { day: 22 },
  { day: 23 },
  { day: 24 },
  { day: 25 },
  { day: 26 },
  { day: 27 },
  { day: 28 },
  { day: 29 },
  { day: 30 },
  { day: 31 },
  { day: 1, muted: true, shaded: true },
];

export const eventLabels: Record<CalendarEventType, string> = {
  anc: 'ANC',
  delivery: 'PERSALINAN',
  risk: 'RISIKO TINGGI',
};
