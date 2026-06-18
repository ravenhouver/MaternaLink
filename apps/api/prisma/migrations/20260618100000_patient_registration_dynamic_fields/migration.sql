ALTER TABLE "pregnancy"
  ADD COLUMN "visit_reason" TEXT,
  ADD COLUMN "chief_complaint" TEXT,
  ADD COLUMN "emergency_signs" JSONB,
  ADD COLUMN "vital_signs" JSONB,
  ADD COLUMN "risk_factors" JSONB,
  ADD COLUMN "routine_medication" JSONB,
  ADD COLUMN "clinical_notes" TEXT,
  ADD COLUMN "responsible_doctor" TEXT,
  ADD COLUMN "priority" TEXT;
