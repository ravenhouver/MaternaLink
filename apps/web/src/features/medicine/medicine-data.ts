import type { AppIconName } from '@/components/ui/app-icon';

export type MedicineStatus = 'safe' | 'warning' | 'danger';

export type MedicineItem = {
  name: string;
  need: string;
  status: MedicineStatus;
  label: string;
};

export type MedicineSection = {
  title: string;
  emoji: string;
  icon: AppIconName;
  items: MedicineItem[];
};

export const medicineSections: MedicineSection[] = [
  {
    title: 'ANC Kit',
    emoji: '💊',
    icon: 'package',
    items: [
      { name: 'Tablet Tambah Darah', need: 'Kebutuhan: 360 Butir', status: 'safe', label: 'Cukup' },
      { name: 'Asam Folat', need: 'Kebutuhan: 120 Butir', status: 'safe', label: 'Cukup' },
    ],
  },
  {
    title: 'Persalinan Kit',
    emoji: '🩺',
    icon: 'briefcase',
    items: [
      { name: 'Oksitosin', need: 'Kebutuhan: 50 Ampul', status: 'danger', label: 'Perlu Restok' },
      { name: 'Lidocaine', need: 'Kebutuhan: 20 Ampul', status: 'warning', label: 'Hampir Habis' },
    ],
  },
  {
    title: 'Buffer Darurat',
    emoji: '⚠️',
    icon: 'archive',
    items: [
      { name: 'MgSO4', need: 'Kebutuhan: 10 Vial', status: 'safe', label: 'Cukup' },
      { name: 'Cairan Infus', need: 'Kebutuhan: 15 Botol', status: 'safe', label: 'Cukup' },
    ],
  },
];
