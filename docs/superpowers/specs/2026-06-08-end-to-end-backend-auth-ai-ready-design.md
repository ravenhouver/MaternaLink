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

This phase must make data dynamic from the database, remove silent no-op buttons from the core flow, and rename unclear frontend URLs so routes match page purpose. Real AI through FastAPI is prepared as an integration contract and local service scaffold, but the shipped v1 uses deterministic fallback data and seeded demo scenarios.

## Architecture

`apps/api` remains the main backend and source of truth. It owns PostgreSQL data through Prisma, workflow state, audit state, and role checks.

The future FastAPI service from `https://github.com/AzrilFahmiardi/ai-logistik-obat-bumil` is integrated later as an AI service behind a NestJS gateway. V1 prepares the local service setup, health check, env wiring, Docker Compose slot, and typed NestJS client, but keeps AI computation on deterministic fallback unless `AI_MODE=remote` is explicitly enabled. NestJS stores AI/fallback results in its own tables before the frontend reads them. The frontend does not call FastAPI directly.

Backend modules to add or extend:

- `auth`: username/password login, logout, session validation, JWT cookie, role guards.
- `patients`: patient identity, pregnancy profile, list/detail, registration create.
- `queue`: today's patient queue, call patient, complete patient.
- `examinations`: clinical visit save, symptoms, diagnosis, medication, anamnesis source.
- `dashboard`: summary data for role-specific dashboards.
- `workflow`: demo runner for forecast, LPLPO, allocation, and recommendation creation.
- `distribution`: recommendation list, item override, approve, reject, tracking.
- `ai`: gateway interface for future FastAPI calls with deterministic fallback.

FastAPI setup to prepare in v1:

- Add `apps/ai-service` or `services/ai-service` as a minimal FastAPI scaffold.
- Include `/health`, `/layer0/extract-symptoms`, `/layer1/forecast-demand`, `/layer2/allocate`, and `/layer2/explain` route stubs.
- Route stubs return schema-valid deterministic stub responses and mark `source=FASTAPI_STUB`.
- Add requirements/project metadata, local run command, and Dockerfile.
- Add Docker Compose service on port `8000`, with NestJS fallback keeping the demo functional when it is down.
- Add a NestJS health check or startup-safe client that calls FastAPI only when `AI_MODE=remote`.
- Do not port notebooks fully in v1; only prepare deployable skeleton and contracts.

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

- puskesmasId, periode, urgency, status, source, priorityRank, justification, routeSummary, createdFromForecastRunId, createdFromAllocationPlanId.
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
- `PATCH /api/distribution/recommendations/reorder`: persist drag-and-drop priority ranks.
- `PATCH /api/distribution/recommendations/:id/items/:itemId`: update override quantity and reason.
- `PATCH /api/distribution/recommendations/:id/approve`
- `PATCH /api/distribution/recommendations/:id/reject`
- `GET /api/distribution/recommendations/:id/tracking`
- `POST /api/distribution/recommendations/:id/tracking/events`

Dashboard endpoints:

- `GET /api/dashboard/summary`: role-aware metrics, recent activity, stock risk, queue counts, and recommendation counts.

## Frontend Flow

### Route Naming

Rename unclear URLs so the browser path matches the actual page and user role. Existing old paths should redirect during transition.

Recommended route names:

- `/dashboard`: main bidan dashboard, replacing `/` as primary logged-in landing.
- `/patients`: patient list, replacing `/master` for patient-facing page.
- `/patients/new`: add-patient method selector, replacing `/master/add-patient`.
- `/patients/new/manual`: manual registration, replacing `/master/add-patient/manual`.
- `/patients/new/kia-upload`: KIA upload/review, replacing `/master/add-patient/upload`.
- `/queue`: patient queue, replacing `/inputs`.
- `/queue/examination`: examination page, replacing `/inputs/examination`.
- `/forecast-calendar`: prediction calendar, replacing `/forecast`.
- `/medicine-needs`: LPLPO/medicine needs, replacing `/lplpo`.
- `/medicine-needs/:medicine`: medicine detail, replacing `/lplpo/:medicine`.
- `/deliveries`: delivery/distribution workflow, replacing `/distribution`.
- `/ifk`: IFK logistics dashboard, replacing `/medicine-sender`.
- `/ifk/recommendations`: distribution recommendations, replacing `/medicine-sender/recommendations`.
- `/ifk/clinics`: clinic list/context, replacing `/medicine-sender/clinics`.
- `/ifk/environment`: environment monitoring, replacing `/medicine-sender/environment`.
- `/ifk/decision-history`: decision history, replacing `/medicine-sender/decision-history`.

Redirect rules:

- Keep old URLs as temporary redirects so current bookmarks and existing links do not break during migration.
- Sidebar, cards, buttons, breadcrumbs, and post-login redirects must use the new URLs after migration.

### Core Flow Pages

`/login`:

- Uses username and password.
- On success redirects based on role:
  - Bidan to `/queue` or `/dashboard`.
  - IFK admin to `/ifk/recommendations`.
  - Super admin to `/dashboard`.

App shell:

- Calls `/api/auth/me` or receives server-side auth state.
- Redirects unauthenticated users to `/login`.
- Shows role-specific navigation.

`/patients/new/manual`:

- Converts fields to controlled form state.
- Submit calls `POST /api/patients`.
- On success, calls `POST /api/queue` and redirects to `/queue`.

`/patients/new/kia-upload`:

- Keeps upload extraction simulated in v1.
- Review state submits through the same patient create endpoint.

`/queue`:

- Reads from `GET /api/queue/today`.
- Search and filters operate on fetched data.
- `Call` transitions row to `EXAMINING` and opens `/queue/examination?queueId=...`.
- `Complete` transitions row to `COMPLETED`.

`/queue/examination`:

- Reads queue and patient context from `queueId`.
- Manual fields are editable.
- Voice flow uses fallback transcript in v1.
- Save calls `POST /api/examinations` and completes the queue row.

`/forecast-calendar`:

- Displays latest forecast runs from API.
- Run/prepare action calls workflow or forecast endpoint.
- Shows confidence, source, and missing-input errors.

`/medicine-needs`:

- Reads `GET /api/lplpo`.
- Stock edit and shipment request persist through API.
- Upload document remains simulated preview, then confirm upserts stock rows.

`/ifk/recommendations`:

- Reads recommendations from API.
- Filters query real status, urgency, and puskesmas data.
- Edit quantity requires reason and persists override.
- Approve/reject update backend state and create tracking/audit entries.
- Track modal reads timeline from API.

`/ifk/decision-history`:

- Reads approved, rejected, dispatched, received, and cancelled recommendations.
- Shows final quantity, override reason, status timestamps, actor, and source.

### User Interaction Fixes

Every visible control in the core flow must either perform a real action, change local UI state, call an API, navigate, or show an explicit disabled/coming-next state. No visible core-flow button should silently do nothing.

Priority interaction fixes:

- Queue search filters patient rows by name, NIK, risk, doctor, and status.
- Queue filter modal reset/apply changes visible rows and URL query state.
- Queue pagination works on fetched data.
- `Call`, `Complete`, and `View Details` call API or navigate to detail views.
- Registration next/back preserves form state and validates required fields before submit.
- Examination fields are real inputs/selects/textareas, not static spans.
- Examination save validates required fields and shows save/loading/error/success states.
- Forecast calendar prev/next changes the visible month and selected period.
- Forecast run/prepare button calls API and updates latest run state.
- Medicine stock edit saves quantity changes.
- Shipment request submit creates or updates backend request/recommendation state.
- KIA upload and medicine document upload keep simulated extraction in v1 but have real file selection, preview, reset, confirm, and persisted result.
- Distribution recommendation filter applies real status/urgency/district/date filters.
- Approve/reject modals update backend and refresh table state.
- Edit recommendation quantity requires reason and persists override.
- Track modal reads backend tracking events and can append report issue events.
- Notification, settings, and help buttons not implemented in v1 show a non-blocking notice or route to a real holding page.

Drag and drop:

- `/ifk/recommendations` recommendation rows support drag-and-drop priority reorder.
- Reorder updates local order immediately and persists via `PATCH /api/distribution/recommendations/reorder`.
- Backend stores `priorityRank` on `DistributionRecommendation`.
- Reorder recalculates route summary in deterministic fallback mode.
- If persistence fails, UI rolls back to previous order and shows an error.
- Keyboard-accessible reorder fallback is required through up/down buttons or menu actions.

Buttons not included in this phase must not fail silently. They should be disabled with a clear label or show a small non-blocking notice that the feature is in the next phase.

## AI Gateway

The AI gateway prepares for the future FastAPI service without making remote AI required for v1.

Environment variables:

- `AI_SERVICE_BASE_URL=http://localhost:8000`
- `AI_SERVICE_TIMEOUT_MS=30000`
- `AI_MODE=disabled|fallback|remote`

Future FastAPI contract:

- `POST /layer0/extract-symptoms`
- `POST /layer1/forecast-demand`
- `POST /layer2/allocate`
- `POST /layer2/explain`

FastAPI scaffold behavior:

- `/health` returns service name, version, and status.
- Layer route stubs validate request/response shapes and return deterministic stub payloads.
- Stub route responses include `source=FASTAPI_STUB` and `modelVersion=stub-v1`.
- NestJS integration tests can run with FastAPI down because fallback remains default.
- Optional smoke test can start FastAPI and verify NestJS remote mode reaches `/health`.

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
- Recommendation reorder persists `priorityRank` and returns recalculated route summary.
- Old route redirects resolve to new frontend URLs where applicable.
- FastAPI `/health` works when the AI service is started.
- NestJS AI gateway falls back cleanly when FastAPI is unavailable.

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
  - drag recommendation rows and verify saved order survives refresh
  - tracking state updates

## Out of Scope for V1

- Production-grade identity provider.
- Password reset, email verification, and user management UI.
- Real KIA OCR extraction.
- Real voice upload, STT, and model extraction.
- Full FastAPI model/notebook port.
- Offline synchronization.
- Full medical decision validation.
- Complete dynamic migration of every secondary page.

## Rollout Order

1. Add auth schema, seed users, login/logout/me endpoints, guards, and frontend login wiring.
2. Add patient, pregnancy, queue, and examination schema plus APIs.
3. Connect manual registration, queue, and examination frontend pages.
4. Extend seed for stock/context/LPLPO/distribution demo state.
5. Add distribution recommendation schema, APIs, and IFK frontend actions.
6. Add FastAPI scaffold, AI gateway fallback, remote-mode health wiring, and workflow demo runner.
7. Rename frontend routes and add old-route redirects.
8. Replace static dashboard/forecast/LPLPO core flow reads with API data.
9. Fix core user interactions, including filters, pagination, upload previews, no-op buttons, and recommendation drag-and-drop reorder.
10. Add e2e tests and browser smoke verification.
11. Expand the same pattern to remaining hardcoded pages after the core flow passes.
