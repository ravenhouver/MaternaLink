ALTER TYPE "RecommendationSource" ADD VALUE IF NOT EXISTS 'HF_AI_LAYER2';

CREATE TYPE "AiWorkflowKind" AS ENUM ('DEMO_AI_WORKFLOW');
CREATE TYPE "AiWorkflowStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'FAILED_PARTIAL');

CREATE TABLE "ai_workflow_job" (
  "id" TEXT NOT NULL,
  "kind" "AiWorkflowKind" NOT NULL DEFAULT 'DEMO_AI_WORKFLOW',
  "status" "AiWorkflowStatus" NOT NULL DEFAULT 'PENDING',
  "puskesmas_id" TEXT NOT NULL,
  "periode" DATE NOT NULL,
  "started_at" TIMESTAMP(3),
  "finished_at" TIMESTAMP(3),
  "error_message" TEXT,
  "warnings" JSONB,
  "forecast_run_id" INTEGER,
  "recommendation_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_workflow_job_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_workflow_job_kind_puskesmas_id_periode_created_at_idx"
  ON "ai_workflow_job"("kind", "puskesmas_id", "periode", "created_at");
