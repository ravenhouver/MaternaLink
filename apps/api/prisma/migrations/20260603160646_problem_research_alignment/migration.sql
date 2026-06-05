/*
  Warnings:

  - You are about to drop the column `teks` on the `anamnesis_raw` table. All the data in the column will be lost.
  - Added the required column `transkrip` to the `anamnesis_raw` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "anamnesis_raw" DROP COLUMN "teks",
ADD COLUMN     "audio_path" TEXT,
ADD COLUMN     "extraction_model" TEXT,
ADD COLUMN     "gejala_extracted" JSONB,
ADD COLUMN     "gejala_validated" JSONB,
ADD COLUMN     "stt_model" TEXT,
ADD COLUMN     "transkrip" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "gejala_kondisi" ADD COLUMN     "bobot_tanpa_lab" DOUBLE PRECISION,
ADD COLUMN     "prior_probability" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "kondisi_obat" ADD COLUMN     "catatan" TEXT,
ADD COLUMN     "prioritas" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "trimester_applicable" TEXT;

-- AlterTable
ALTER TABLE "konteks_periode" ADD COLUMN     "jumlah_bumil_t1" INTEGER,
ADD COLUMN     "jumlah_bumil_t2" INTEGER,
ADD COLUMN     "jumlah_bumil_t3" INTEGER,
ADD COLUMN     "riwayat_stockout_6bln" JSONB,
ADD COLUMN     "status_klb" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "obat" ADD COLUMN     "dosis_standar_harian" DOUBLE PRECISION,
ADD COLUMN     "durasi_pengobatan_hari" INTEGER;

-- AlterTable
ALTER TABLE "puskesmas" ADD COLUMN     "jarak_ke_ifk_km" DOUBLE PRECISION,
ADD COLUMN     "kabupaten_kota" TEXT,
ADD COLUMN     "kapasitas_simpan_obat" INTEGER,
ADD COLUMN     "ketersediaan_lab" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lead_time_hari" DOUBLE PRECISION,
ADD COLUMN     "provinsi" TEXT,
ADD COLUMN     "skor_aksesibilitas" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "status_endemis_malaria" BOOLEAN NOT NULL DEFAULT false;
