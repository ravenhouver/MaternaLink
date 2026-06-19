import type { AppIconName } from '@/components/ui/app-icon';

export type InputMethod = {
  key: 'manual' | 'voice';
  title: string;
  subtitle: string;
  description: string;
  icon: AppIconName;
  visual?: 'softOrb';
  button: string;
  buttonIcon: AppIconName;
  featured?: boolean;
};

export const inputMethods: InputMethod[] = [
  {
    key: 'manual',
    title: 'Ketik Manual',
    subtitle: 'Isi form langkah demi langkah',
    description: 'Pilihan terbaik untuk input data mendetail dengan kontrol penuh pada setiap kolom isian.',
    icon: 'edit',
    visual: 'softOrb',
    button: 'Mulai Mengetik',
    buttonIcon: 'arrowRight',
  },
  {
    key: 'voice',
    title: 'Input Suara',
    subtitle: 'Cukup bicara, AI yang catat',
    description: 'Metode tercepat saat sedang menangani pasien. Bicara secara natural untuk mencatat anamnesa.',
    icon: 'mic',
    visual: 'softOrb',
    button: 'Mulai Bicara',
    buttonIcon: 'mic',
  },
];

export const registrationSteps = [
  { number: 1, label: 'Data Diri' },
  { number: 2, label: 'Data Kehamilan' },
  { number: 3, label: 'Faktor Risiko' },
];

export const riskFactors = [
  { title: 'Hipertensi', description: 'Tekanan darah tinggi' },
  { title: 'Anemia', description: 'Kurang darah' },
  { title: 'Diabetes Gestasional', description: 'Kadar gula darah tinggi saat hamil' },
  { title: 'Kehamilan Bermasalah', description: 'Riwayat komplikasi sebelumnya' },
  { title: 'Usia di bawah 18 tahun', description: 'Risiko kehamilan usia dini' },
  { title: 'Usia di atas 35 tahun', description: 'Risiko tinggi usia matang' },
  { title: 'Kehamilan kembar', description: 'Multiplet (Gemelli)', wide: true },
];
