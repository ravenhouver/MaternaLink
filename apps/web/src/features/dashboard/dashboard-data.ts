import type { AppIconName } from '@/components/ui/app-icon';

export type DashboardStat = {
  label: string;
  value: string;
  icon: AppIconName;
  accent: string;
  tag: string;
};

export type QuickAction = {
  label: string;
  icon: AppIconName;
  active?: boolean;
};

export type RecentActivity = {
  name: string;
  title: string;
  meta: string;
  icon: AppIconName;
  background: string;
};

export const dashboardStats: DashboardStat[] = [
  {
    label: 'TOTAL PASIEN\nTERDAFTAR',
    value: '42',
    icon: 'users',
    accent: '#1a73e8',
    tag: '+4 bulan ini',
  },
  {
    label: 'PERSALINAN BULAN INI',
    value: '8',
    icon: 'heart',
    accent: '#006948',
    tag: 'Normal',
  },
  {
    label: 'PASIEN RISIKO TINGGI',
    value: '5',
    icon: 'alert',
    accent: '#a33d23',
    tag: 'Butuh Pantauan',
  },
  {
    label: 'OBAT PERLU RESTOK',
    value: '3',
    icon: 'package',
    accent: '#f59e0b',
    tag: 'Kritis',
  },
];

export const quickActions: QuickAction[] = [
  { label: '+ Pasien Baru', icon: 'userPlus', active: true },
  { label: 'Kalender', icon: 'calendar' },
  { label: 'Daftar Obat', icon: 'package' },
  { label: 'Daftar Pasien', icon: 'clipboard' },
];

export const recentActivities: RecentActivity[] = [
  {
    name: 'Ibu Maria',
    title: 'Kunjungan ANC',
    meta: '10 Menit yang lalu - Pemeriksaan rutin trimester 2',
    icon: 'clipboard',
    background: '#eff6ff',
  },
  {
    name: 'Ibu Siti',
    title: 'Data Risiko Diperbarui',
    meta: '1 Jam yang lalu - Tekanan darah meningkat (140/90)',
    icon: 'alert',
    background: '#fef2f2',
  },
  {
    name: 'Ibu Rahayu',
    title: 'Hasil Laboratorium',
    meta: '3 Jam yang lalu - Hemoglobin: 11.5 g/dL (Normal)',
    icon: 'fileText',
    background: '#f0fdf4',
  },
];
