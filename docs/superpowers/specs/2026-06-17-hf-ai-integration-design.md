# HF AI Integration Design

Date: 2026-06-17
Project: MaternaLink (`D:\Furap-Jogja`)

## Goal

Replace the local Python AI stub runtime with the hosted MaternaLink AI API at `https://azrilfahmiardi-maternalink-ai.hf.space`. The existing demo workflow should run through the hosted AI service, persist results in the current backend data model, and surface progress in the frontend without blocking long HTTP requests.

## Current State

- The repo contains a local FastAPI stub in `apps/ai-service` with deterministic placeholder endpoints.
- `AiService` in `apps/api/src/modules/ai/ai.service.ts` only checks `/health`.
- `ForecastService.run()` creates deterministic `ForecastRun` and `PrediksiStok` rows from local stock inputs.
- `WorkflowService.runDemo()` runs forecast and LPLPO inline, then creates a `DistributionRecommendation` with `source = RULE_BASED_FALLBACK`.
- The frontend calls `POST /api/workflow/demo/run` and reads `GET /api/workflow/demo/state`.

## External AI Contract

Base URL: `https://azrilfahmiardi-maternalink-ai.hf.space`

Relevant endpoints:

- `GET /health`
- `POST /api/v1/layer0/extract`
- `POST /api/v1/layer1/forecast`
- `POST /api/v1/layer2/allocate`

Layer 2 can take several minutes for a full allocation run, so the frontend must not hold one long request open while waiting for completion.

## Chosen Approach

Use a backend async job that calls the hosted AI API directly.

The frontend triggers a workflow job and polls backend state. The backend owns all external AI calls, persistence, fallback behavior, and error reporting. The local `apps/ai-service` container is removed from runtime configuration. Deterministic behavior remains available only as an explicit fallback mode for development or offline demos.

## Backend Architecture

### AI Client

Extend `AiService` into a typed gateway with these methods:

- `getHealth()`
- `extractSymptoms(request)`
- `forecastDemand(request)`
- `allocate(request)`

Configuration:

- `AI_SERVICE_BASE_URL`, default `https://azrilfahmiardi-maternalink-ai.hf.space`
- `AI_MODE`, default `remote`
- `AI_SERVICE_TIMEOUT_MS`, default `30000`
- `AI_LAYER2_TIMEOUT_MS`, default `600000`

### Workflow Job

Add persistent workflow job state so `/workflow/demo/run` can return immediately.

Suggested model fields:

- `id`
- `kind`, initially `DEMO_AI_WORKFLOW`
- `status`: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `FAILED_PARTIAL`
- `puskesmasId`
- `periode`
- `startedAt`, `finishedAt`
- `errorMessage`
- `warnings` JSON
- `forecastRunId`
- `recommendationId`

`WorkflowService.runDemo()` should create or replace the active demo job, start async processing, then return `{ jobId, status }`. `getDemoState()` should include the latest job and persisted forecast/LPLPO/recommendation data.

## AI Workflow Data Flow

1. Load source data for the demo puskesmas and period:
   - puskesmas
   - medicine stock rows
   - medicine master rows
   - context row
   - diagnosis rows
   - anamnesis rows

2. Layer 0 extraction:
   - Send `anamnesisRaw.transkrip` as `records[].transcript`.
   - Send diagnosis rows as `manual_diagnoses`.
   - Use `condition_estimates` for Layer 1 case estimates.
   - If Layer 0 fails, record a warning and continue with manual diagnosis fallback.

3. Layer 1 forecast:
   - Call `/api/v1/layer1/forecast` once per stock row.
   - Map local data as follows:
     - `facility_id = puskesmasId`
     - `drug_id = obatId`
     - `period = periode`
     - `closing_stock = stokSaatIni`
     - `estimated_total_cases = condition estimate related to the drug/condition`, fallback to diagnosis count or consumption
     - `lead_time_days = puskesmas.leadTimeHari`
     - `rainy_season_access = context.rainyAccess` mapped to the external enum/string format
     - `accessibility_score = normalized puskesmas.skorAksesibilitas or context.accessScore`
     - `standard_daily_dose = obat.dosisStandarHarian`
     - `treatment_duration_days = obat.durasiPengobatanHari`
   - Persist successful results into `ForecastRun` and `PrediksiStok`.
   - If some rows fail, continue and store warnings. If all rows fail, mark job `FAILED`.

4. LPLPO generation:
   - Reuse the existing LPLPO generation from persisted forecast rows.

5. Layer 2 allocation:
   - Build `l1_forecasts` from persisted Layer 1 results.
   - Build `ifk_stock` from available local stock inputs. If there is no IFK-level stock model yet, use demo-safe available stock derived from total requirements so the hosted allocator can return a recommendation.
   - Include stockout history from context where available.
   - Persist allocation output into `DistributionRecommendation` and `DistributionRecommendationItem` rows.
   - Set `source = HF_AI_LAYER2`.
   - Use allocation `justification` for recommendation justification.
   - If Layer 2 fails after forecast/LPLPO succeeded, mark job `FAILED_PARTIAL` and leave forecast/LPLPO data available.

## Frontend Behavior

The forecast calendar run action should remain the user entry point.

Expected behavior:

- User clicks Run.
- Button becomes disabled and shows an AI workflow running state.
- Frontend polls `GET /workflow/demo/state` until job is `COMPLETED`, `FAILED`, or `FAILED_PARTIAL`.
- On `COMPLETED`, refresh forecast, LPLPO, and IFK recommendation views.
- On `FAILED` or `FAILED_PARTIAL`, show the backend error message and allow retry.

The frontend must not call Hugging Face directly. The backend remains the integration boundary.

## Runtime Changes

- Remove the `ai-service` container from `docker-compose.yml`.
- Remove API `depends_on` for `ai-service`.
- Set API `AI_SERVICE_BASE_URL` to the hosted Hugging Face URL.
- Set API `AI_MODE=remote` by default.
- Keep the `apps/ai-service` directory only as legacy/reference unless a later cleanup removes it fully.
- Update README runtime docs so local development no longer instructs users to start the Python AI stub.

## Error Handling

- Health timeout or service unavailable: job `FAILED` with a clear external service error.
- Layer 0 failure: warning, continue with manual diagnosis fallback.
- Partial Layer 1 failure: warning, persist successful rows.
- Total Layer 1 failure: job `FAILED`.
- Layer 2 failure after forecast/LPLPO: job `FAILED_PARTIAL`.
- Long Layer 2 execution: use `AI_LAYER2_TIMEOUT_MS`, default 10 minutes.

## Tests

Backend tests:

- Unit-test `AiService` request/response mapping with mocked `fetch`.
- E2E-test `POST /workflow/demo/run` and polling state with mocked AI calls.
- Verify persisted `ForecastRun`, `PrediksiStok`, `LplpoPrediktif`, `DistributionRecommendation`, and recommendation items.
- Verify Layer 2 failure creates `FAILED_PARTIAL` while keeping forecast/LPLPO rows.

Frontend tests or smoke checks:

- Run button enters running state.
- Polling updates completed state.
- Failure message appears and retry remains available.

Verification commands:

- `pnpm run build:api`
- `pnpm run build:web`
- `pnpm run test:e2e`

Manual smoke:

1. Login as `bidan/password123`.
2. Open `/forecast-calendar`.
3. Run workflow and wait for completion.
4. Login as `ifk/password123`.
5. Open `/ifk/recommendations` and verify `source = HF_AI_LAYER2` recommendation rows.

## Out of Scope

- Rebuilding the hosted AI service.
- Adding a separate queue worker process.
- Designing a new IFK stock inventory model beyond the minimum required demo-safe allocation input.
- Direct frontend calls to Hugging Face.
