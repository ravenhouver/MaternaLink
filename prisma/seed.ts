import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const puskesmasRows = [
    {
      id: 'PKM-001',
      nama: 'Puskesmas MaternaLink 001',
      kecamatan: 'Umbulharjo',
      kabupatenKota: 'Kota Yogyakarta',
      provinsi: 'DI Yogyakarta',
      tipe: 'RAWAT_INAP' as const,
      rainyAccess: 'AMAN' as const,
      coldChainReady: true,
      statusEndemisMalaria: false,
      ketersediaanLab: true,
      kapasitasSimpanObat: 1200,
      jarakKeIfkKm: 8,
      leadTimeHari: 1,
      skorAksesibilitas: 3,
    },
    {
      id: 'PKM-REMOTE-001',
      nama: 'Puskesmas Lembah Sari',
      kecamatan: 'Satarmese',
      kabupatenKota: 'Kab. Manggarai',
      provinsi: 'NTT',
      tipe: 'NON_RAWAT_INAP' as const,
      rainyAccess: 'TERGANGGU' as const,
      coldChainReady: false,
      statusEndemisMalaria: true,
      ketersediaanLab: false,
      kapasitasSimpanObat: 500,
      jarakKeIfkKm: 85.5,
      leadTimeHari: 7,
      skorAksesibilitas: 1,
    },
  ];

  for (const row of puskesmasRows) {
    await prisma.puskesmas.upsert({
      where: { id: row.id },
      update: row,
      create: row,
    });
  }

  const conditions = [
    ['K01', 'Malaria'],
    ['K02', 'Anemia Kehamilan'],
    ['K03', 'Hipertensi / Preeklampsia'],
    ['K04', 'Diabetes Gestasional'],
    ['K05', 'Infeksi Saluran Kemih'],
    ['K06', 'Infeksi Vagina'],
    ['K11', 'ISPA / Pneumonia'],
    ['K12', 'Depresi / Kecemasan Antenatal'],
    ['K13', 'Heartburn / GERD'],
    ['K14', 'Konstipasi / Wasir'],
  ] as const;

  for (const [id, nama] of conditions) {
    await prisma.kondisi.upsert({
      where: { id },
      update: { nama },
      create: { id, nama },
    });
  }

  const symptoms = [
    ['G01', 'Demam tinggi'],
    ['G02', 'Menggigil'],
    ['G03', 'Mual / muntah berlebihan'],
    ['G04', 'Lemas / mudah lelah ekstrem'],
    ['G05', 'Pusing / sakit kepala berat'],
    ['G06', 'Bengkak wajah / kaki'],
    ['G07', 'Nyeri / panas saat kencing'],
    ['G09', 'Penglihatan kabur'],
    ['G11', 'Sesak napas'],
    ['G15', 'Susah BAB / perut kembung'],
  ] as const;

  for (const [id, nama] of symptoms) {
    await prisma.gejala.upsert({
      where: { id },
      update: { nama },
      create: { id, nama },
    });
  }

  const medicines = [
    ['OBT-001', 'Kina', 'OBAT', 'TABLET', false, 3, 7],
    ['OBT-002', 'Klindamisin', 'OBAT', 'KAPSUL', false, 3, 7],
    ['OBT-003', 'ACT (Artemisinin Combination Therapy)', 'OBAT', 'TABLET', false, 4, 3],
    ['OBT-004', 'Fe dosis tinggi', 'OBAT', 'TABLET', false, 1, 30],
    ['OBT-008', 'Nifedipin', 'OBAT', 'TABLET', false, 2, 30],
    ['OBT-009', 'Metildopa', 'OBAT', 'TABLET', false, 2, 30],
    ['OBT-010', 'MgSO4 (Magnesium Sulfat)', 'OBAT', 'INJEKSI', true, 1, 1],
    ['OBT-013', 'Amoksisilin', 'OBAT', 'KAPSUL', false, 3, 7],
    ['OBT-024', 'Parasetamol', 'OBAT', 'TABLET', false, 3, 5],
    ['OBT-028', 'Laktulosa', 'OBAT', 'CAIRAN', false, 1, 7],
  ] as const;

  for (const [id, nama, kategori, tipe, perluColdChain, dosisStandarHarian, durasiPengobatanHari] of medicines) {
    await prisma.obat.upsert({
      where: { id },
      update: { nama, kategori, tipe, perluColdChain, dosisStandarHarian, durasiPengobatanHari },
      create: { id, nama, kategori, tipe, perluColdChain, satuan: 'unit', dosisStandarHarian, durasiPengobatanHari },
    });
  }

  const conditionMedicineRows = [
    ['K01', 'OBT-001', '3 tablet per hari', 'T1', 1, 'Malaria trimester awal'],
    ['K01', 'OBT-003', '4 tablet per hari', 'T2,T3', 1, 'Malaria trimester lanjut'],
    ['K02', 'OBT-004', '1 tablet per hari', 'T1,T2,T3', 1, 'Anemia berat'],
    ['K03', 'OBT-008', '2 tablet per hari', 'T2,T3', 1, 'Hipertensi kehamilan'],
    ['K03', 'OBT-010', 'sesuai protokol kegawatdaruratan', 'T2,T3', 1, 'Preeklampsia berat atau kejang'],
    ['K05', 'OBT-013', '3 kapsul per hari', 'T1,T2,T3', 1, 'ISK maternal'],
  ] as const;

  for (const [kondisiId, obatId, dosis, trimesterApplicable, prioritas, catatan] of conditionMedicineRows) {
    await prisma.kondisiObat.upsert({
      where: { kondisiId_obatId: { kondisiId, obatId } },
      update: { dosis, trimesterApplicable, prioritas, catatan },
      create: { kondisiId, obatId, dosis, trimesterApplicable, prioritas, catatan },
    });
  }

  const symptomConditionRows = [
    ['G01', 'K01', 3, 0.6, 0.8],
    ['G02', 'K01', 3, 0.5, 0.7],
    ['G04', 'K02', 2, 0.4, 0.6],
    ['G05', 'K03', 2, 0.4, 0.6],
    ['G06', 'K03', 3, 0.6, 0.8],
    ['G07', 'K05', 3, 0.7, 0.7],
  ] as const;

  for (const [gejalaId, kondisiId, bobot, priorProbability, bobotTanpaLab] of symptomConditionRows) {
    await prisma.gejalaKondisi.upsert({
      where: { gejalaId_kondisiId: { gejalaId, kondisiId } },
      update: { bobot, priorProbability, bobotTanpaLab },
      create: { gejalaId, kondisiId, bobot, priorProbability, bobotTanpaLab },
    });
  }

  await prisma.stokPuskesmas.upsert({
    where: {
      puskesmasId_obatId_periode: {
        puskesmasId: 'PKM-001',
        obatId: 'OBT-001',
        periode: new Date('2025-03-01'),
      },
    },
    update: { stokAwal: 100, konsumsiPeriode: 80, stokSaatIni: 20 },
    create: {
      puskesmasId: 'PKM-001',
      obatId: 'OBT-001',
      periode: new Date('2025-03-01'),
      stokAwal: 100,
      konsumsiPeriode: 80,
      stokSaatIni: 20,
    },
  });

  await prisma.konteksPeriode.upsert({
    where: { puskesmasId_periode: { puskesmasId: 'PKM-REMOTE-001', periode: new Date('2025-04-01') } },
    update: {
      season: 'HUJAN',
      accessScore: 1,
      rainyAccess: 'TERGANGGU',
      routeDisrupted: true,
      jumlahBumilT1: 10,
      jumlahBumilT2: 15,
      jumlahBumilT3: 12,
      statusKlb: false,
      riwayatStockout6Bln: { 'OBT-010': 2 },
    },
    create: {
      puskesmasId: 'PKM-REMOTE-001',
      periode: new Date('2025-04-01'),
      season: 'HUJAN',
      accessScore: 1,
      rainyAccess: 'TERGANGGU',
      routeDisrupted: true,
      jumlahBumilT1: 10,
      jumlahBumilT2: 15,
      jumlahBumilT3: 12,
      statusKlb: false,
      riwayatStockout6Bln: { 'OBT-010': 2 },
    },
  });

  await prisma.stokPuskesmas.upsert({
    where: {
      puskesmasId_obatId_periode: {
        puskesmasId: 'PKM-REMOTE-001',
        obatId: 'OBT-010',
        periode: new Date('2025-04-01'),
      },
    },
    update: { stokAwal: 15, konsumsiPeriode: 12, stokSaatIni: 3 },
    create: {
      puskesmasId: 'PKM-REMOTE-001',
      obatId: 'OBT-010',
      periode: new Date('2025-04-01'),
      stokAwal: 15,
      konsumsiPeriode: 12,
      stokSaatIni: 3,
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
