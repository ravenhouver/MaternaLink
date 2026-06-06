export type DashboardStat = {
  label: string;
  value: string;
  icon: string;
  accent: string;
  tag: string;
};

export type QuickAction = {
  label: string;
  icon: string;
  active?: boolean;
};

export type RecentActivity = {
  name: string;
  title: string;
  meta: string;
  icon: string;
  background: string;
};

export const dashboardStats: DashboardStat[] = [
  {
    label: 'TOTAL PASIEN\nTERDAFTAR',
    value: '42',
    icon: 'patients.svg',
    accent: '#1a73e8',
    tag: '+4 bulan ini',
  },
  {
    label: 'PERSALINAN BULAN INI',
    value: '8',
    icon: 'delivery.svg',
    accent: '#006948',
    tag: 'Normal',
  },
  {
    label: 'PASIEN RISIKO TINGGI',
    value: '5',
    icon: 'risk.svg',
    accent: '#a33d23',
    tag: 'Butuh Pantauan',
  },
  {
    label: 'OBAT PERLU RESTOK',
    value: '3',
    icon: 'stock.svg',
    accent: '#f59e0b',
    tag: 'Kritis',
  },
];

export const quickActions: QuickAction[] = [
  { label: '+ Pasien Baru', icon: 'add-patient.svg', active: true },
  { label: 'Kalender', icon: 'calendar.svg' },
  { label: 'Daftar Obat', icon: 'medicine.svg' },
  { label: 'Daftar Pasien', icon: 'clipboard.svg' },
];

export const recentActivities: RecentActivity[] = [
  {
    name: 'Ibu Maria',
    title: 'Kunjungan ANC',
    meta: '10 Menit yang lalu - Pemeriksaan rutin trimester 2',
    icon: 'activity-anc.svg',
    background: '#eff6ff',
  },
  {
    name: 'Ibu Siti',
    title: 'Data Risiko Diperbarui',
    meta: '1 Jam yang lalu - Tekanan darah meningkat (140/90)',
    icon: 'activity-risk.svg',
    background: '#fef2f2',
  },
  {
    name: 'Ibu Rahayu',
    title: 'Hasil Laboratorium',
    meta: '3 Jam yang lalu - Hemoglobin: 11.5 g/dL (Normal)',
    icon: 'activity-lab.svg',
    background: '#f0fdf4',
  },
];
