-- CreateEnum
CREATE TYPE "PuskesmasType" AS ENUM ('RAWAT_INAP', 'NON_RAWAT_INAP');

-- CreateEnum
CREATE TYPE "RainyAccess" AS ENUM ('AMAN', 'TERBATAS', 'TERGANGGU');

-- CreateEnum
CREATE TYPE "MedicineCategory" AS ENUM ('OBAT', 'VAKSIN', 'ALAT_KESEHATAN');

-- CreateEnum
CREATE TYPE "MedicineType" AS ENUM ('TABLET', 'SIRUP', 'INJEKSI', 'KAPSUL', 'CAIRAN', 'LAINNYA');

-- CreateEnum
CREATE TYPE "DiagnosisSource" AS ENUM ('DOKTER', 'BIDAN', 'SISTEM', 'IMPORT');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('KEMARAU', 'HUJAN', 'PANCAROBA');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ForecastStatus" AS ENUM ('DRAFT', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('ROUTE_DISRUPTION', 'COLD_CHAIN_MISMATCH', 'LOW_STOCK');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('DRAFT', 'SIMULATED', 'APPROVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "puskesmas" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "tipe" "PuskesmasType" NOT NULL,
    "rainy_access" "RainyAccess" NOT NULL DEFAULT 'AMAN',
    "cold_chain_ready" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puskesmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obat" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" "MedicineCategory" NOT NULL,
    "tipe" "MedicineType" NOT NULL,
    "perlu_cold_chain" BOOLEAN NOT NULL DEFAULT false,
    "satuan" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kondisi" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kondisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gejala" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gejala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kondisi_obat" (
    "id" SERIAL NOT NULL,
    "kondisi_id" TEXT NOT NULL,
    "obat_id" TEXT NOT NULL,
    "dosis" TEXT,

    CONSTRAINT "kondisi_obat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gejala_kondisi" (
    "id" SERIAL NOT NULL,
    "gejala_id" TEXT NOT NULL,
    "kondisi_id" TEXT NOT NULL,
    "bobot" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "gejala_kondisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosis_periode" (
    "id" SERIAL NOT NULL,
    "puskesmas_id" TEXT NOT NULL,
    "kondisi_id" TEXT NOT NULL,
    "periode" DATE NOT NULL,
    "jumlah_kasus" INTEGER NOT NULL,
    "source" "DiagnosisSource" NOT NULL DEFAULT 'IMPORT',

    CONSTRAINT "diagnosis_periode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gejala_periode" (
    "id" SERIAL NOT NULL,
    "puskesmas_id" TEXT NOT NULL,
    "gejala_id" TEXT NOT NULL,
    "periode" DATE NOT NULL,
    "jumlah" INTEGER NOT NULL,

    CONSTRAINT "gejala_periode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamnesis_raw" (
    "id" SERIAL NOT NULL,
    "puskesmas_id" TEXT NOT NULL,
    "periode" DATE NOT NULL,
    "teks" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anamnesis_raw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "konteks_periode" (
    "id" SERIAL NOT NULL,
    "puskesmas_id" TEXT NOT NULL,
    "periode" DATE NOT NULL,
    "season" "Season" NOT NULL,
    "access_score" INTEGER NOT NULL DEFAULT 0,
    "rainy_access" "RainyAccess" NOT NULL DEFAULT 'AMAN',
    "route_disrupted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "konteks_periode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stok_puskesmas" (
    "id" SERIAL NOT NULL,
    "puskesmas_id" TEXT NOT NULL,
    "obat_id" TEXT NOT NULL,
    "periode" DATE NOT NULL,
    "stok_awal" INTEGER NOT NULL,
    "konsumsi_periode" INTEGER NOT NULL,
    "stok_saat_ini" INTEGER NOT NULL,

    CONSTRAINT "stok_puskesmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_run" (
    "id" SERIAL NOT NULL,
    "puskesmas_id" TEXT NOT NULL,
    "periode" DATE NOT NULL,
    "status" "ForecastStatus" NOT NULL DEFAULT 'COMPLETED',
    "confidence" "Confidence" NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forecast_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediksi_stok" (
    "id" SERIAL NOT NULL,
    "forecast_run_id" INTEGER NOT NULL,
    "obat_id" TEXT NOT NULL,
    "kondisi_id" TEXT,
    "kebutuhan_obat" INTEGER NOT NULL,
    "buffer_persen" DOUBLE PRECISION NOT NULL,
    "total_rekomendasi" INTEGER NOT NULL,
    "stok_saat_ini" INTEGER NOT NULL,
    "konsumsi_periode" INTEGER NOT NULL,
    "confidence" "Confidence" NOT NULL DEFAULT 'MEDIUM',

    CONSTRAINT "prediksi_stok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lplpo_prediktif" (
    "id" SERIAL NOT NULL,
    "prediksi_stok_id" INTEGER NOT NULL,
    "puskesmas_id" TEXT NOT NULL,
    "obat_id" TEXT NOT NULL,
    "periode" DATE NOT NULL,
    "jumlah_diminta" INTEGER NOT NULL,
    "days_of_stock" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lplpo_prediktif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_rekonsiliasi" (
    "id" SERIAL NOT NULL,
    "obat_id" TEXT NOT NULL,
    "periode" DATE NOT NULL,
    "catatan" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_rekonsiliasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocation_plan" (
    "id" SERIAL NOT NULL,
    "puskesmas_id" TEXT NOT NULL,
    "periode" DATE NOT NULL,
    "status" "AllocationStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocation_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocation_plan_item" (
    "id" SERIAL NOT NULL,
    "allocation_plan_id" INTEGER NOT NULL,
    "obat_id" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "allocation_plan_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert" (
    "id" SERIAL NOT NULL,
    "puskesmas_id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "puskesmas_nama_key" ON "puskesmas"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "obat_nama_key" ON "obat"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "kondisi_nama_key" ON "kondisi"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "gejala_nama_key" ON "gejala"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "kondisi_obat_kondisi_id_obat_id_key" ON "kondisi_obat"("kondisi_id", "obat_id");

-- CreateIndex
CREATE UNIQUE INDEX "gejala_kondisi_gejala_id_kondisi_id_key" ON "gejala_kondisi"("gejala_id", "kondisi_id");

-- CreateIndex
CREATE UNIQUE INDEX "diagnosis_periode_puskesmas_id_kondisi_id_periode_key" ON "diagnosis_periode"("puskesmas_id", "kondisi_id", "periode");

-- CreateIndex
CREATE UNIQUE INDEX "gejala_periode_puskesmas_id_gejala_id_periode_key" ON "gejala_periode"("puskesmas_id", "gejala_id", "periode");

-- CreateIndex
CREATE UNIQUE INDEX "konteks_periode_puskesmas_id_periode_key" ON "konteks_periode"("puskesmas_id", "periode");

-- CreateIndex
CREATE UNIQUE INDEX "stok_puskesmas_puskesmas_id_obat_id_periode_key" ON "stok_puskesmas"("puskesmas_id", "obat_id", "periode");

-- CreateIndex
CREATE UNIQUE INDEX "prediksi_stok_forecast_run_id_obat_id_key" ON "prediksi_stok"("forecast_run_id", "obat_id");

-- CreateIndex
CREATE UNIQUE INDEX "lplpo_prediktif_prediksi_stok_id_key" ON "lplpo_prediktif"("prediksi_stok_id");

-- AddForeignKey
ALTER TABLE "kondisi_obat" ADD CONSTRAINT "kondisi_obat_kondisi_id_fkey" FOREIGN KEY ("kondisi_id") REFERENCES "kondisi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kondisi_obat" ADD CONSTRAINT "kondisi_obat_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gejala_kondisi" ADD CONSTRAINT "gejala_kondisi_gejala_id_fkey" FOREIGN KEY ("gejala_id") REFERENCES "gejala"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gejala_kondisi" ADD CONSTRAINT "gejala_kondisi_kondisi_id_fkey" FOREIGN KEY ("kondisi_id") REFERENCES "kondisi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosis_periode" ADD CONSTRAINT "diagnosis_periode_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosis_periode" ADD CONSTRAINT "diagnosis_periode_kondisi_id_fkey" FOREIGN KEY ("kondisi_id") REFERENCES "kondisi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gejala_periode" ADD CONSTRAINT "gejala_periode_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gejala_periode" ADD CONSTRAINT "gejala_periode_gejala_id_fkey" FOREIGN KEY ("gejala_id") REFERENCES "gejala"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_raw" ADD CONSTRAINT "anamnesis_raw_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "konteks_periode" ADD CONSTRAINT "konteks_periode_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_puskesmas" ADD CONSTRAINT "stok_puskesmas_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_puskesmas" ADD CONSTRAINT "stok_puskesmas_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecast_run" ADD CONSTRAINT "forecast_run_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediksi_stok" ADD CONSTRAINT "prediksi_stok_forecast_run_id_fkey" FOREIGN KEY ("forecast_run_id") REFERENCES "forecast_run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediksi_stok" ADD CONSTRAINT "prediksi_stok_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediksi_stok" ADD CONSTRAINT "prediksi_stok_kondisi_id_fkey" FOREIGN KEY ("kondisi_id") REFERENCES "kondisi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lplpo_prediktif" ADD CONSTRAINT "lplpo_prediktif_prediksi_stok_id_fkey" FOREIGN KEY ("prediksi_stok_id") REFERENCES "prediksi_stok"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lplpo_prediktif" ADD CONSTRAINT "lplpo_prediktif_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lplpo_prediktif" ADD CONSTRAINT "lplpo_prediktif_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_rekonsiliasi" ADD CONSTRAINT "log_rekonsiliasi_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_plan" ADD CONSTRAINT "allocation_plan_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_plan_item" ADD CONSTRAINT "allocation_plan_item_allocation_plan_id_fkey" FOREIGN KEY ("allocation_plan_id") REFERENCES "allocation_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation_plan_item" ADD CONSTRAINT "allocation_plan_item_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert" ADD CONSTRAINT "alert_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
