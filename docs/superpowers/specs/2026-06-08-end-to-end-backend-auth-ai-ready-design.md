# End-to-End Backend, Auth, and AI-Ready Integration Design

Date: 2026-06-08
Project: MaternaLink / Furap Jogja

## Goal

Build one mature end-to-end demo flow first, then expand the same backend patterns to every remaining frontend page.

The first flow is:

1. Bidan logs in.
2. Bidan registers a patient.
3. Patient enters today's queue.
4. Bidan calls the patient and saves an examination.
5. Examination, stock, diagnosis, symptom, and context data feed the forecast/LPLPO workflow.
6. IFK admin logs in.
7. IFK admin reviews distribution recommendations.
8. IFK admin edits quantities with reason, approves or rejects, and tracks shipment events.

This phase must make data dynamic from the database and remove silent no-op buttons from the core flow. Real AI through FastAPI is prepared as an integration contract, but the shipped v1 uses deterministic fallback data and seeded demo scenarios.

## Architecture

`apps/api` remains the main backend and source of truth. It owns PostgreSQL data through Prisma, workflow state, audit state, and role checks.

The future FastAPI service from `https://github.com/AzrilFahmiardi/ai-logistik-obat-bumil` is integrated later as an AI service behind a NestJS gateway. NestJS stores AI/fallback results in its own tables before the frontend reads them. The frontend does not call FastAPI directly.

Backend modules to add or extend:

- `auth`: username/password login, logout, session validation, JWT cookie, role guards.
- `patients`: patient identity, pregnancy profile, list/detail, registration create.
- `queue`: today's patient queue, call patient, complete patient.
- `examinations`: clinical visit save, symptoms, diagnosis, medication, anamnesis source.
- `dashboard`: summary data for role-specific dashboards.
- `workflow`: demo runner for forecast, LPLPO, allocation, and recommendation creation.
- `distribution`: recommendation list, item override, approve, reject, tracking.
- `ai`: gateway interface for future FastAPI calls with deterministic fallback.

Existing modules remain useful and should be extended instead of replaced:

- `master`
- `inputs`
- `forecast`
- `lplpo`
- `distribution`

## Auth and Roles

Auth uses username and password for demo speed and clear presentation. Passwords are hashed in the database. Login creates a JWT stored in an httpOnly cookie.

Cookie:

- Name: `maternalink_session`
- httpOnly: true
- sameSite: lax
- secure: false in local development
- secure: true in production-like environments

JWT payload:

- `sub`: user id
- `username`
- `role`
- `puskesmasId`: optional, set for puskesmas users

Roles:

- `BIDAN_PUSKESMAS`: registration, queue, examination, puskesmas inventory, LPLPO request.
- `IFK_ADMIN`: distribution recommendations, override quantity, approve, reject, tracking.
- `SUPER_ADMIN`: all access for demo and debugging.

Seeded demo users:

- `bidan / password123`, role `BIDAN_PUSKESMAS`, linked to `PKM-001`.
- `ifk / password123`, role `IFK_ADMIN`.
- `admin / password123`, role `SUPER_ADMIN`.

Auth endpoints:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Authorization behavior:

- Unauthenticated API calls return 401.
- Authenticated users without the required role return 403.
- Frontend redirects unauthenticated users to `/login`.
- Menus and action buttons are role-aware, but server-side guards remain authoritative.

## Data Model

Add Prisma models with explicit relations to existing domain data.

`User`:

- username, passwordHash, displayName, role, puskesmasId, active flag.

`AuditLog`:

- userId, action, entityType, entityId, metadata, createdAt.
- Used for login, patient create, examination save, forecast workflow run, quantity override, approve, reject, and tracking events.

`Patient`:

- full name, NIK, date of birth, address, phone, BPJS number, emergency contact, blood type, allergy, chronic history.

`Pregnancy`:

- patientId, puskesmasId, LMP/HPHT, EDD/HPL, gestational age, gravida, para, abortus, ANC visit, pregnancy type, risk level.

`PatientQueue`:

- patientId, pregnancyId, puskesmasId, queueNo, assignedDoctor, status, queuedAt, calledAt, completedAt.
- Status values: `WAITING`, `EXAMINING`, `COMPLETED`, `CANCELLED`.

`Examination`:

- patientId, pregnancyId, queueId, puskesmasId, source, complaint, vital signs, gestational age, ANC visit, diagnosis, symptoms, medication, notes, risk summary, createdBy.
- Source values: `MANUAL`, `VOICE_TRANSCRIPT_FALLBACK`, later `VOICE_TRANSCRIPT_AI`.

`DistributionRecommendation`:

- puskesmasId, periode, urgency, status, source, justification, routeSummary, createdFromForecastRunId, createdFromAllocationPlanId.
- Status values: `PENDING`, `APPROVED`, `REJECTED`, `DISPATCHED`, `RECEIVED`, `CANCELLED`.
- Source values: `SEEDED_DETERMINISTIC`, `RULE_BASED_FALLBACK`, later `FASTAPI_AI`.

`DistributionRecommendationItem`:

- recommendationId, obatId, aiQuantity, overrideQuantity, finalQuantity, overrideReason.

`ShipmentTrackingEvent`:

- recommendationId, status, note, actorUserId, createdAt.

Existing models keep their current role:

- `Puskesmas`, `Obat`, `Kondisi`, `Gejala` for master data.
- `DiagnosisPeriode`, `GejalaPeriode`, `AnamnesisRaw`, `KonteksPeriode`, `StokPuskesmas` for workflow inputs.
- `ForecastRun`, `PrediksiStok`, `LplpoPrediktif`, `AllocationPlan`, `Alert` for forecast and distribution computation.

## API Design

Patient and queue endpoints:

- `POST /api/patients`: create patient and active pregnancy.
- `GET /api/patients`: list patients with filters.
- `GET /api/patients/:id`: patient detail with active pregnancy and recent examinations.
- `POST /api/queue`: add patient to today's queue.
- `GET /api/queue/today`: today's queue for current user's puskesmas unless admin query overrides it.
- `PATCH /api/queue/:id/status`: transition queue status.

Examination endpoints:

- `GET /api/examinations/:id`: examination detail.
- `POST /api/examinations`: save examination and update queue status.

On examination save, the API also upserts period-level data needed by existing forecast modules:

- `DiagnosisPeriode` from selected diagnosis.
- `GejalaPeriode` from selected/extracted symptoms.
- `AnamnesisRaw` when complaint/transcript text exists.

Workflow endpoints:

- `POST /api/workflow/demo/run`: run deterministic demo workflow for one puskesmas and period.
- `GET /api/workflow/demo/state`: return current demo state for dashboard continuation.

Forecast/LPLPO endpoints continue to exist and can be called directly:

- `POST /api/forecast/run`
- `GET /api/forecast/runs`
- `GET /api/forecast/runs/:id/results`
- `POST /api/lplpo/generate`
- `GET /api/lplpo`

Distribution endpoints:

- `GET /api/distribution/recommendations`
- `GET /api/distribution/recommendations/:id`
- `PATCH /api/distribution/recommendations/:id/items/:itemId`: update override quantity and reason.
- `PATCH /api/distribution/recommendations/:id/approve`
- `PATCH /api/distribution/recommendations/:id/reject`
- `GET /api/distribution/recommendations/:id/tracking`
- `POST /api/distribution/recommendations/:id/tracking/events`

Dashboard endpoints:

- `GET /api/dashboard/summary`: role-aware metrics, recent activity, stock risk, queue counts, and recommendation counts.

## Frontend Flow

`/login`:

- Uses username and password.
- On success redirects based on role:
  - Bidan to `/inputs` or `/`.
  - IFK admin to `/medicine-sender/recommendations`.
  - Super admin to `/`.

App shell:

- Calls `/api/auth/me` or receives server-side auth state.
- Redirects unauthenticated users to `/login`.
- Shows role-specific navigation.

`/master/add-patient/manual`:

- Converts fields to controlled form state.
- Submit calls `POST /api/patients`.
- On success, calls `POST /api/queue` and redirects to `/inputs`.

`/master/add-patient/upload`:

- Keeps upload extraction simulated in v1.
- Review state submits through the same patient create endpoint.

`/inputs`:

- Reads from `GET /api/queue/today`.
- Search and filters operate on fetched data.
- `Call` transitions row to `EXAMINING` and opens `/inputs/examination?queueId=...`.
- `Complete` transitions row to `COMPLETED`.

`/inputs/examination`:

- Reads queue and patient context from `queueId`.
- Manual fields are editable.
- Voice flow uses fallback transcript in v1.
- Save calls `POST /api/examinations` and completes the queue row.

`/forecast`:

- Displays latest forecast runs from API.
- Run/prepare action calls workflow or forecast endpoint.
- Shows confidence, source, and missing-input errors.

`/lplpo`:

- Reads `GET /api/lplpo`.
- Stock edit and shipment request persist through API.
- Upload document remains simulated preview, then confirm upserts stock rows.

`/medicine-sender/recommendations`:

- Reads recommendations from API.
- Filters query real status, urgency, and puskesmas data.
- Edit quantity requires reason and persists override.
- Approve/reject update backend state and create tracking/audit entries.
- Track modal reads timeline from API.

`/medicine-sender/decision-history`:

- Reads approved, rejected, dispatched, received, and cancelled recommendations.
- Shows final quantity, override reason, status timestamps, actor, and source.

Buttons not included in this phase must not fail silently. They should be disabled with a clear label or show a small non-blocking notice that the feature is in the next phase.

## AI Gateway

The AI gateway prepares for the future FastAPI service without making it required for v1.

Environment variables:

- `AI_SERVICE_BASE_URL=http://localhost:8000`
- `AI_SERVICE_TIMEOUT_MS=30000`
- `AI_MODE=disabled|fallback|remote`

Future FastAPI contract:

- `POST /layer0/extract-symptoms`
- `POST /layer1/forecast-demand`
- `POST /layer2/allocate`
- `POST /layer2/explain`

Rules:

- LLM never decides quantities.
- Forecast quantity and allocation quantity come from deterministic code or optimization output.
- LLM explanation can only refer to numbers already present in the payload.
- If FastAPI is unavailable, NestJS uses fallback and marks output source as `RULE_BASED_FALLBACK`.

V1 fallback behavior:

- Symptom extraction can map known seeded phrases to `Gejala` IDs.
- Demand forecast can reuse existing `ForecastService` rules and store source metadata.
- Allocation recommendations can be created from LPLPO rows, stock, cold-chain readiness, access score, lead time, and rainy access.
- Explanation is a deterministic template with data values inserted from saved rows.

## Seeder

Seeder must be idempotent and use stable identifiers.

Seed data includes:

- Demo users and roles.
- `PKM-001` as primary puskesmas for bidan.
- IFK/admin scenario data.
- Master data for puskesmas, medicines, conditions, symptoms, condition-medicine mapping, and symptom-condition mapping.
- Several patients and pregnancies for lists.
- Today's queue with waiting, examining, and completed rows.
- One patient ready for examination.
- Stock and context rows that create a visible critical medicine scenario.
- Forecast, LPLPO, distribution recommendation, recommendation items, and tracking rows for initial page load.

Seed source fields must clearly say `SEEDED_DETERMINISTIC` or `RULE_BASED_FALLBACK`. Do not present seeded data as real AI output.

## Error Handling

- Missing auth returns 401.
- Forbidden role returns 403.
- Missing required workflow inputs returns 400 with field names and recovery guidance.
- Invalid queue transition returns 409.
- Approve/reject is idempotent for already final states and returns the current state.
- Override quantity without reason returns 400.
- Failed FastAPI calls do not break demo workflow when `AI_MODE=fallback` is allowed.
- Frontend shows loading, empty, and error states for all core flow API calls.

## Testing

API e2e tests:

- Login success and failure.
- `/auth/me` with and without cookie.
- Bidan can create patient, queue patient, call patient, save examination.
- IFK admin cannot create examination.
- Bidan cannot approve distribution.
- IFK admin can update override quantity with reason.
- Override quantity without reason fails.
- IFK admin can approve and reject recommendations.
- Demo workflow creates forecast, LPLPO, recommendation, and tracking output.
- Seed can run twice without duplicate core demo rows.

Frontend verification:

- `pnpm run build:api`
- `pnpm run build:web`
- `pnpm run test:e2e`
- Manual smoke flow in browser:
  - login as `bidan`
  - register patient
  - queue patient appears
  - call and save examination
  - run workflow or open forecast/LPLPO
  - logout/login as `ifk`
  - approve/reject recommendation
  - tracking state updates

## Out of Scope for V1

- Production-grade identity provider.
- Password reset, email verification, and user management UI.
- Real KIA OCR extraction.
- Real voice upload, STT, and model extraction.
- Full FastAPI implementation.
- Offline synchronization.
- Full medical decision validation.
- Complete dynamic migration of every secondary page.

## Rollout Order

1. Add auth schema, seed users, login/logout/me endpoints, guards, and frontend login wiring.
2. Add patient, pregnancy, queue, and examination schema plus APIs.
3. Connect manual registration, queue, and examination frontend pages.
4. Extend seed for stock/context/LPLPO/distribution demo state.
5. Add distribution recommendation schema, APIs, and IFK frontend actions.
6. Add AI gateway fallback and workflow demo runner.
7. Replace static dashboard/forecast/LPLPO core flow reads with API data.
8. Add e2e tests and browser smoke verification.
9. Expand the same pattern to remaining hardcoded pages after the core flow passes.

