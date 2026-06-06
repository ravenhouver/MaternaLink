export type PatientRisk = 'high' | 'normal';

export type Patient = {
  key: string;
  initials: string;
  name: string;
  id: string;
  gestationalAge: number;
  dueDate: string;
  dueHint: string;
  ancDone: number;
  ancExtra?: number;
  risk: PatientRisk;
};

export const patientFilters = ['Semua', 'HPL Bulan Depan', 'Risiko Tinggi', 'HPL Bulan Ini'];

export const patients: Patient[] = [
  {
    key: 'maria',
    initials: 'MB',
    name: 'Ibu Maria',
    id: 'ML-2024-001',
    gestationalAge: 32,
    dueDate: '12 Feb 2024',
    dueHint: '7 hari lagi',
    ancDone: 3,
    ancExtra: 2,
    risk: 'high',
  },
  {
    key: 'siti',
    initials: 'IS',
    name: 'Ibu Siti',
    id: 'ML-2024-042',
    gestationalAge: 14,
    dueDate: '20 Jun 2024',
    dueHint: 'Trimester 2',
    ancDone: 1,
    risk: 'normal',
  },
  {
    key: 'ani',
    initials: 'AW',
    name: 'Ibu Ani Wijaya',
    id: 'ML-2024-105',
    gestationalAge: 38,
    dueDate: '05 Feb 2024',
    dueHint: 'Besok!',
    ancDone: 4,
    risk: 'normal',
  },
];
