import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const queueAt = (hour: number, minute = 0) => {
    const value = new Date(today);
    value.setHours(hour, minute, 0, 0);
    return value;
  };

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

  const demoUsers = [
    { username: 'bidan', displayName: 'Bidan Sari', role: 'BIDAN_PUSKESMAS' as const, puskesmasId: 'PKM-001' },
    { username: 'ifk', displayName: 'Admin IFK Sleman', role: 'IFK_ADMIN' as const, puskesmasId: null },
  ];

  await prisma.user.deleteMany({ where: { username: 'admin' } });

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        displayName: user.displayName,
        role: user.role,
        puskesmasId: user.puskesmasId,
        active: true,
      },
      create: {
        ...user,
        active: true,
        passwordHash: hashPassword('password123', `maternalink-${user.username}`),
      },
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

  const patient = await prisma.patient.upsert({
    where: { nik: '3404015203980001' },
    update: {
      fullName: 'Ny. Anisa Rahmawati',
      puskesmasId: 'PKM-001',
      phone: '081234567890',
      address: 'Umbulharjo, Kota Yogyakarta',
      bpjsNumber: '0001234567890',
      emergencyName: 'Budi Rahmawan',
      emergencyPhone: '081299999999',
      bloodType: 'O',
      allergy: 'Tidak ada',
      chronicHistory: 'Hipertensi',
    },
    create: {
      nik: '3404015203980001',
      fullName: 'Ny. Anisa Rahmawati',
      puskesmasId: 'PKM-001',
      dateOfBirth: new Date('1998-03-15'),
      phone: '081234567890',
      address: 'Umbulharjo, Kota Yogyakarta',
      bpjsNumber: '0001234567890',
      emergencyName: 'Budi Rahmawan',
      emergencyPhone: '081299999999',
      bloodType: 'O',
      allergy: 'Tidak ada',
      chronicHistory: 'Hipertensi',
    },
  });

  const pregnancy = await prisma.pregnancy.upsert({
    where: { id: 'PREG-DEMO-001' },
    update: {
      patientId: patient.id,
      puskesmasId: 'PKM-001',
      gestationalAge: 36,
      ancVisit: 'K5 - Trimester 3',
      riskLevel: 'HIGH',
      active: true,
    },
    create: {
      id: 'PREG-DEMO-001',
      patientId: patient.id,
      puskesmasId: 'PKM-001',
      lmp: new Date('2025-04-20'),
      edd: new Date('2026-01-25'),
      gestationalAge: 36,
      gravida: 2,
      para: 1,
      abortus: 0,
      ancVisit: 'K5 - Trimester 3',
      pregnancyType: 'Single',
      riskLevel: 'HIGH',
      active: true,
    },
  });

  await prisma.patientQueue.upsert({
    where: {
      puskesmasId_queueNo_queuedAt: {
        puskesmasId: 'PKM-001',
        queueNo: 'A-001',
        queuedAt: queueAt(8),
      },
    },
    update: {
      patientId: patient.id,
      pregnancyId: pregnancy.id,
      status: 'WAITING',
      assignedDoctor: 'dr. Ratna Wulandari',
      calledAt: null,
      completedAt: null,
    },
    create: {
      patientId: patient.id,
      pregnancyId: pregnancy.id,
      puskesmasId: 'PKM-001',
      queueNo: 'A-001',
      assignedDoctor: 'dr. Ratna Wulandari',
      status: 'WAITING',
      queuedAt: queueAt(8),
    },
  });

  const patientSeeds = [
    {
      queueNo: 'A-002',
      nik: '3404015204920002',
      fullName: 'Ny. Dewi Lestari',
      phone: '081234567891',
      address: 'Kotagede, Kota Yogyakarta',
      pregnancyId: 'PREG-DEMO-002',
      gestationalAge: 28,
      ancVisit: 'K3 - Trimester 2',
      riskLevel: 'MEDIUM' as const,
      queueStatus: 'EXAMINING' as const,
      queuedAt: queueAt(8, 20),
    },
    {
      queueNo: 'A-003',
      nik: '3404015205010003',
      fullName: 'Ny. Maria Ulfa',
      phone: '081234567892',
      address: 'Mergangsan, Kota Yogyakarta',
      pregnancyId: 'PREG-DEMO-003',
      gestationalAge: 32,
      ancVisit: 'K4 - Trimester 3',
      riskLevel: 'LOW' as const,
      queueStatus: 'WAITING' as const,
      queuedAt: queueAt(8, 40),
    },
  ];

  for (const item of patientSeeds) {
    const seededPatient = await prisma.patient.upsert({
      where: { nik: item.nik },
      update: { fullName: item.fullName, phone: item.phone, address: item.address, puskesmasId: 'PKM-001' },
      create: { nik: item.nik, fullName: item.fullName, phone: item.phone, address: item.address, puskesmasId: 'PKM-001' },
    });

    const seededPregnancy = await prisma.pregnancy.upsert({
      where: { id: item.pregnancyId },
      update: {
        patientId: seededPatient.id,
        puskesmasId: 'PKM-001',
        gestationalAge: item.gestationalAge,
        ancVisit: item.ancVisit,
        riskLevel: item.riskLevel,
        active: true,
      },
      create: {
        id: item.pregnancyId,
        patientId: seededPatient.id,
        puskesmasId: 'PKM-001',
        gestationalAge: item.gestationalAge,
        ancVisit: item.ancVisit,
        riskLevel: item.riskLevel,
        active: true,
      },
    });

    await prisma.patientQueue.upsert({
      where: { puskesmasId_queueNo_queuedAt: { puskesmasId: 'PKM-001', queueNo: item.queueNo, queuedAt: item.queuedAt } },
      update: {
        patientId: seededPatient.id,
        pregnancyId: seededPregnancy.id,
        status: item.queueStatus,
        assignedDoctor: 'dr. Ratna Wulandari',
        calledAt: item.queueStatus === 'EXAMINING' ? queueAt(9) : null,
        completedAt: null,
      },
      create: {
        patientId: seededPatient.id,
        pregnancyId: seededPregnancy.id,
        puskesmasId: 'PKM-001',
        queueNo: item.queueNo,
        assignedDoctor: 'dr. Ratna Wulandari',
        status: item.queueStatus,
        queuedAt: item.queuedAt,
        calledAt: item.queueStatus === 'EXAMINING' ? queueAt(9) : null,
      },
    });
  }

  await prisma.stokPuskesmas.upsert({
    where: {
      puskesmasId_obatId_periode: {
        puskesmasId: 'PKM-001',
        obatId: 'OBT-010',
        periode: new Date('2026-06-01'),
      },
    },
    update: { stokAwal: 20, konsumsiPeriode: 18, stokSaatIni: 2 },
    create: {
      puskesmasId: 'PKM-001',
      obatId: 'OBT-010',
      periode: new Date('2026-06-01'),
      stokAwal: 20,
      konsumsiPeriode: 18,
      stokSaatIni: 2,
    },
  });

  await prisma.konteksPeriode.upsert({
    where: { puskesmasId_periode: { puskesmasId: 'PKM-001', periode: new Date('2026-06-01') } },
    update: {
      season: 'PANCAROBA',
      accessScore: 2,
      rainyAccess: 'TERBATAS',
      routeDisrupted: false,
      jumlahBumilT1: 18,
      jumlahBumilT2: 24,
      jumlahBumilT3: 20,
      statusKlb: false,
      riwayatStockout6Bln: { 'OBT-010': 1 },
    },
    create: {
      puskesmasId: 'PKM-001',
      periode: new Date('2026-06-01'),
      season: 'PANCAROBA',
      accessScore: 2,
      rainyAccess: 'TERBATAS',
      routeDisrupted: false,
      jumlahBumilT1: 18,
      jumlahBumilT2: 24,
      jumlahBumilT3: 20,
      statusKlb: false,
      riwayatStockout6Bln: { 'OBT-010': 1 },
    },
  });

  const recommendation = await prisma.distributionRecommendation.upsert({
    where: { id: 'REC-DEMO-001' },
    update: {
      puskesmasId: 'PKM-001',
      periode: new Date('2026-06-01'),
      status: 'PENDING',
      urgency: 'CRITICAL',
      priorityRank: 1,
      source: 'SEEDED_DETERMINISTIC',
      justification: 'MgSO4 stock is critical and route risk requires immediate IFK review.',
      routeSummary: { estimateMinutes: 45, courier: 'Sdr. Bambang', route: 'IFK Sleman - PKM-001' },
    },
    create: {
      id: 'REC-DEMO-001',
      puskesmasId: 'PKM-001',
      periode: new Date('2026-06-01'),
      status: 'PENDING',
      urgency: 'CRITICAL',
      priorityRank: 1,
      source: 'SEEDED_DETERMINISTIC',
      justification: 'MgSO4 stock is critical and route risk requires immediate IFK review.',
      routeSummary: { estimateMinutes: 45, courier: 'Sdr. Bambang', route: 'IFK Sleman - PKM-001' },
    },
  });

  await prisma.distributionRecommendationItem.upsert({
    where: { id: 'RECITEM-DEMO-001' },
    update: { aiQuantity: 20, finalQuantity: 20, overrideQuantity: null, overrideReason: null },
    create: {
      id: 'RECITEM-DEMO-001',
      recommendationId: recommendation.id,
      obatId: 'OBT-010',
      aiQuantity: 20,
      finalQuantity: 20,
    },
  });

  await prisma.shipmentTrackingEvent.upsert({
    where: { id: 'TRACK-DEMO-001' },
    update: { recommendationId: recommendation.id, status: 'REQUESTED', note: 'Recommendation created from seeded deterministic scenario.' },
    create: {
      id: 'TRACK-DEMO-001',
      recommendationId: recommendation.id,
      status: 'REQUESTED',
      note: 'Recommendation created from seeded deterministic scenario.',
    },
  });

  const remoteRecommendation = await prisma.distributionRecommendation.upsert({
    where: { id: 'REC-DEMO-002' },
    update: {
      puskesmasId: 'PKM-REMOTE-001',
      periode: new Date('2026-06-01'),
      status: 'PENDING',
      urgency: 'WARNING',
      priorityRank: 2,
      source: 'SEEDED_DETERMINISTIC',
      justification: 'Remote rainy access and limited cold chain require prioritized buffer stock.',
      routeSummary: { estimateMinutes: 260, courier: 'Tim IFK Mobile', route: 'IFK - Puskesmas Lembah Sari' },
    },
    create: {
      id: 'REC-DEMO-002',
      puskesmasId: 'PKM-REMOTE-001',
      periode: new Date('2026-06-01'),
      status: 'PENDING',
      urgency: 'WARNING',
      priorityRank: 2,
      source: 'SEEDED_DETERMINISTIC',
      justification: 'Remote rainy access and limited cold chain require prioritized buffer stock.',
      routeSummary: { estimateMinutes: 260, courier: 'Tim IFK Mobile', route: 'IFK - Puskesmas Lembah Sari' },
    },
  });

  await prisma.distributionRecommendationItem.upsert({
    where: { id: 'RECITEM-DEMO-002' },
    update: { aiQuantity: 35, finalQuantity: 35, overrideQuantity: null, overrideReason: null },
    create: { id: 'RECITEM-DEMO-002', recommendationId: remoteRecommendation.id, obatId: 'OBT-004', aiQuantity: 35, finalQuantity: 35 },
  });

  const alertRows = [
    { puskesmasId: 'PKM-REMOTE-001', type: 'ROUTE_DISRUPTION' as const, severity: 'HIGH' as const, message: 'Rainy access disruption risk for Puskesmas Lembah Sari.', resolved: false },
    { puskesmasId: 'PKM-001', type: 'LOW_STOCK' as const, severity: 'CRITICAL' as const, message: 'MgSO4 stock at PKM-001 is below emergency buffer.', resolved: false },
  ];

  for (const row of alertRows) {
    const existingAlert = await prisma.alert.findFirst({ where: { puskesmasId: row.puskesmasId, type: row.type, message: row.message } });
    if (existingAlert) {
      await prisma.alert.update({ where: { id: existingAlert.id }, data: row });
    } else {
      await prisma.alert.create({ data: row });
    }
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
