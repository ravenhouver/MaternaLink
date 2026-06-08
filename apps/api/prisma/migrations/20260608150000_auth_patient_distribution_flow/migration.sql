-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BIDAN_PUSKESMAS', 'IFK_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('WAITING', 'EXAMINING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExaminationSource" AS ENUM ('MANUAL', 'VOICE_TRANSCRIPT_FALLBACK', 'VOICE_TRANSCRIPT_AI');

-- CreateEnum
CREATE TYPE "PregnancyRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISPATCHED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecommendationUrgency" AS ENUM ('ROUTINE', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RecommendationSource" AS ENUM ('SEEDED_DETERMINISTIC', 'RULE_BASED_FALLBACK', 'FASTAPI_STUB', 'FASTAPI_AI');

-- CreateEnum
CREATE TYPE "TrackingStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'DISPATCHED', 'RECEIVED', 'ISSUE_REPORTED');

-- CreateTable
CREATE TABLE "user_account" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "puskesmas_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient" (
    "id" TEXT NOT NULL,
    "puskesmas_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "date_of_birth" DATE,
    "address" TEXT,
    "phone" TEXT,
    "bpjs_number" TEXT,
    "emergency_name" TEXT,
    "emergency_phone" TEXT,
    "blood_type" TEXT,
    "allergy" TEXT,
    "chronic_history" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pregnancy" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "puskesmas_id" TEXT NOT NULL,
    "lmp" DATE,
    "edd" DATE,
    "gestational_age" INTEGER,
    "gravida" INTEGER,
    "para" INTEGER,
    "abortus" INTEGER,
    "anc_visit" TEXT,
    "pregnancy_type" TEXT,
    "risk_level" "PregnancyRiskLevel" NOT NULL DEFAULT 'LOW',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pregnancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_queue" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "pregnancy_id" TEXT NOT NULL,
    "puskesmas_id" TEXT NOT NULL,
    "queue_no" TEXT NOT NULL,
    "assigned_doctor" TEXT,
    "status" "QueueStatus" NOT NULL DEFAULT 'WAITING',
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "called_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "patient_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examination" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "pregnancy_id" TEXT NOT NULL,
    "queue_id" TEXT,
    "puskesmas_id" TEXT NOT NULL,
    "source" "ExaminationSource" NOT NULL DEFAULT 'MANUAL',
    "complaint" TEXT,
    "vital_signs" JSONB,
    "gestational_age" INTEGER,
    "anc_visit" TEXT,
    "diagnosis" JSONB,
    "symptoms" JSONB,
    "medication" JSONB,
    "notes" TEXT,
    "risk_summary" JSONB,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "examination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_recommendation" (
    "id" TEXT NOT NULL,
    "puskesmas_id" TEXT NOT NULL,
    "periode" DATE NOT NULL,
    "urgency" "RecommendationUrgency" NOT NULL DEFAULT 'ROUTINE',
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "source" "RecommendationSource" NOT NULL DEFAULT 'RULE_BASED_FALLBACK',
    "priority_rank" INTEGER NOT NULL DEFAULT 100,
    "justification" TEXT,
    "route_summary" JSONB,
    "created_from_forecast_run_id" INTEGER,
    "created_from_allocation_plan_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_recommendation_item" (
    "id" TEXT NOT NULL,
    "recommendation_id" TEXT NOT NULL,
    "obat_id" TEXT NOT NULL,
    "ai_quantity" INTEGER NOT NULL,
    "override_quantity" INTEGER,
    "final_quantity" INTEGER NOT NULL,
    "override_reason" TEXT,

    CONSTRAINT "distribution_recommendation_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_tracking_event" (
    "id" TEXT NOT NULL,
    "recommendation_id" TEXT NOT NULL,
    "status" "TrackingStatus" NOT NULL,
    "note" TEXT,
    "actor_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_tracking_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_account_username_key" ON "user_account"("username");

-- CreateIndex
CREATE UNIQUE INDEX "patient_nik_key" ON "patient"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "patient_queue_puskesmas_id_queue_no_queued_at_key" ON "patient_queue"("puskesmas_id", "queue_no", "queued_at");

-- CreateIndex
CREATE UNIQUE INDEX "examination_queue_id_key" ON "examination"("queue_id");

-- AddForeignKey
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient" ADD CONSTRAINT "patient_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregnancy" ADD CONSTRAINT "pregnancy_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregnancy" ADD CONSTRAINT "pregnancy_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_queue" ADD CONSTRAINT "patient_queue_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_queue" ADD CONSTRAINT "patient_queue_pregnancy_id_fkey" FOREIGN KEY ("pregnancy_id") REFERENCES "pregnancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_queue" ADD CONSTRAINT "patient_queue_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examination" ADD CONSTRAINT "examination_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examination" ADD CONSTRAINT "examination_pregnancy_id_fkey" FOREIGN KEY ("pregnancy_id") REFERENCES "pregnancy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examination" ADD CONSTRAINT "examination_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "patient_queue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examination" ADD CONSTRAINT "examination_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examination" ADD CONSTRAINT "examination_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_recommendation" ADD CONSTRAINT "distribution_recommendation_puskesmas_id_fkey" FOREIGN KEY ("puskesmas_id") REFERENCES "puskesmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_recommendation" ADD CONSTRAINT "distribution_recommendation_created_from_forecast_run_id_fkey" FOREIGN KEY ("created_from_forecast_run_id") REFERENCES "forecast_run"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_recommendation" ADD CONSTRAINT "distribution_recommendation_created_from_allocation_plan_i_fkey" FOREIGN KEY ("created_from_allocation_plan_id") REFERENCES "allocation_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_recommendation_item" ADD CONSTRAINT "distribution_recommendation_item_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "distribution_recommendation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_recommendation_item" ADD CONSTRAINT "distribution_recommendation_item_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_tracking_event" ADD CONSTRAINT "shipment_tracking_event_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "distribution_recommendation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_tracking_event" ADD CONSTRAINT "shipment_tracking_event_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "user_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

