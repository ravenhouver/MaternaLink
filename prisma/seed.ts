import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.puskesmas.upsert({
    where: { id: 'PKM-001' },
    update: {},
    create: {
      id: 'PKM-001',
      nama: 'Puskesmas MaternaLink 001',
      kecamatan: 'Umbulharjo',
      tipe: 'RAWAT_INAP',
      rainyAccess: 'AMAN',
      coldChainReady: true,
    },
  });

  const conditions = [
    ['K01', 'Anemia Kehamilan'],
    ['K02', 'Hipertensi Kehamilan'],
    ['K03', 'Infeksi Saluran Kemih'],
    ['K04', 'Diabetes Gestasional'],
    ['K05', 'Mual Muntah Berlebih'],
  ] as const;

  for (const [id, nama] of conditions) {
    await prisma.kondisi.upsert({
      where: { id },
      update: { nama },
      create: { id, nama },
    });
  }

  const symptoms = [
    ['G01', 'Lemas'],
    ['G02', 'Pusing'],
    ['G03', 'Nyeri Saat BAK'],
    ['G04', 'Mual'],
    ['G05', 'Bengkak Kaki'],
  ] as const;

  for (const [id, nama] of symptoms) {
    await prisma.gejala.upsert({
      where: { id },
      update: { nama },
      create: { id, nama },
    });
  }

  const medicines = [
    ['OBT-001', 'Tablet Tambah Darah', 'TABLET', false],
    ['OBT-002', 'Kalsium Laktat', 'TABLET', false],
    ['OBT-003', 'Amoksisilin', 'KAPSUL', false],
    ['OBT-004', 'Metildopa', 'TABLET', false],
    ['OBT-010', 'Vaksin Tetanus', 'INJEKSI', true],
  ] as const;

  for (const [id, nama, tipe, perluColdChain] of medicines) {
    await prisma.obat.upsert({
      where: { id },
      update: { nama, tipe, perluColdChain },
      create: { id, nama, kategori: perluColdChain ? 'VAKSIN' : 'OBAT', tipe, perluColdChain, satuan: 'unit' },
    });
  }

  await prisma.kondisiObat.upsert({
    where: { kondisiId_obatId: { kondisiId: 'K01', obatId: 'OBT-001' } },
    update: { dosis: '1 tablet per hari' },
    create: { kondisiId: 'K01', obatId: 'OBT-001', dosis: '1 tablet per hari' },
  });

  await prisma.gejalaKondisi.upsert({
    where: { gejalaId_kondisiId: { gejalaId: 'G01', kondisiId: 'K01' } },
    update: { bobot: 3 },
    create: { gejalaId: 'G01', kondisiId: 'K01', bobot: 3 },
  });

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
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
