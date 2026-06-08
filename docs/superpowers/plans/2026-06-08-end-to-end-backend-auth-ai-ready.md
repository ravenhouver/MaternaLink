# End-to-End Backend Auth AI Ready Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one role-authenticated, database-backed MaternaLink demo flow from patient registration through IFK distribution approval, with FastAPI AI service scaffolding prepared for later model integration.

**Architecture:** NestJS remains source of truth for auth, Prisma data, workflow state, and deterministic fallback. FastAPI is added as a local stub service behind a NestJS AI gateway, while Next.js migrates core pages to clearer route names and database-backed interactions.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 16, Next.js 15, React 18, Ant Design 5, native HTML drag/drop, FastAPI, Docker Compose, Jest e2e, Supertest.

---

## Scope Check

Implement the approved vertical slice first: `/login -> /patients/new/manual -> /queue -> /queue/examination -> /forecast-calendar -> /medicine-needs -> /ifk/recommendations -> /ifk/decision-history`. Keep old URLs as redirects. Do not make every secondary page dynamic until this flow passes tests.

---

## File Structure Map

Backend files:

- Modify `apps/api/prisma/schema.prisma`: auth, patient, queue, examination, recommendation, tracking models.
- Modify `apps/api/prisma/seed.ts`: idempotent demo users and flow data.
- Create `apps/api/src/common/auth/current-user.ts`, `auth-utils.ts`, `roles.decorator.ts`, `auth.guard.ts`, `roles.guard.ts`.
- Create `apps/api/src/modules/auth/*`.
- Create `apps/api/src/modules/patients/*`.
- Create `apps/api/src/modules/queue/*`.
- Create `apps/api/src/modules/examinations/*`.
- Modify `apps/api/src/modules/distribution/*` for recommendation APIs.
- Create `apps/api/src/modules/ai/*`.
- Create `apps/api/src/modules/workflow/*`.
- Modify `apps/api/src/app.module.ts`.
- Modify `apps/api/test/app.e2e-spec.ts`.

FastAPI files:

- Create `apps/ai-service/requirements.txt`.
- Create `apps/ai-service/main.py`.
- Create `apps/ai-service/Dockerfile`.
- Modify `docker-compose.yml`.

Frontend files:

- Modify `apps/web/src/lib/api.ts`.
- Create `apps/web/src/lib/routes.ts`.
- Modify `apps/web/src/components/layout/sidebar.tsx`.
- Modify `apps/web/src/components/layout/app-shell.tsx`.
- Modify `apps/web/src/features/login/login-page-content.tsx`.
- Create route pages under `apps/web/src/app/dashboard`, `patients`, `queue`, `forecast-calendar`, `medicine-needs`, `deliveries`, and `ifk`.
- Modify feature components for registration, queue, examination, forecast calendar, medicine needs, IFK recommendations, and decision history.

---

## Task 1: Prisma Schema and Migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/*_auth_patient_distribution_flow/migration.sql`

- [ ] **Step 1: Add enums**

Add these Prisma enums after `AllocationStatus`: `UserRole`, `QueueStatus`, `ExaminationSource`, `PregnancyRiskLevel`, `RecommendationStatus`, `RecommendationUrgency`, `RecommendationSource`, and `TrackingStatus`.

Required enum values:

```prisma
enum UserRole { BIDAN_PUSKESMAS IFK_ADMIN SUPER_ADMIN }
enum QueueStatus { WAITING EXAMINING COMPLETED CANCELLED }
enum ExaminationSource { MANUAL VOICE_TRANSCRIPT_FALLBACK VOICE_TRANSCRIPT_AI }
enum PregnancyRiskLevel { LOW MEDIUM HIGH }
enum RecommendationStatus { PENDING APPROVED REJECTED DISPATCHED RECEIVED CANCELLED }
enum RecommendationUrgency { ROUTINE WARNING CRITICAL }
enum RecommendationSource { SEEDED_DETERMINISTIC RULE_BASED_FALLBACK FASTAPI_STUB FASTAPI_AI }
enum TrackingStatus { REQUESTED APPROVED REJECTED DISPATCHED RECEIVED ISSUE_REPORTED }
```

- [ ] **Step 2: Add models**

Add Prisma models named exactly: `User`, `AuditLog`, `Patient`, `Pregnancy`, `PatientQueue`, `Examination`, `DistributionRecommendation`, `DistributionRecommendationItem`, `ShipmentTrackingEvent`.

Minimum required unique stable IDs for seeded rows:

```prisma
model User { id String @id @default(cuid()) username String @unique passwordHash String displayName String role UserRole puskesmasId String? active Boolean @default(true) createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }
model Patient { id String @id @default(cuid()) puskesmasId String fullName String nik String @unique phone String? address String? createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }
model Pregnancy { id String @id @default(cuid()) patientId String puskesmasId String gestationalAge Int? ancVisit String? riskLevel PregnancyRiskLevel @default(LOW) active Boolean @default(true) createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }
model PatientQueue { id String @id @default(cuid()) patientId String pregnancyId String puskesmasId String queueNo String assignedDoctor String? status QueueStatus @default(WAITING) queuedAt DateTime @default(now()) calledAt DateTime? completedAt DateTime? }
model DistributionRecommendation { id String @id @default(cuid()) puskesmasId String periode DateTime @db.Date urgency RecommendationUrgency @default(ROUTINE) status RecommendationStatus @default(PENDING) source RecommendationSource @default(RULE_BASED_FALLBACK) priorityRank Int @default(100) justification String? routeSummary Json? createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }
```

Add relation fields to existing `Puskesmas`, `Obat`, `ForecastRun`, and `AllocationPlan` so Prisma validates relations. Use Prisma format output to correct alignment.

- [ ] **Step 3: Format and migrate**

Run:

```bash
pnpm --filter @maternalink/api prisma format
pnpm run prisma:migrate -- --name auth_patient_distribution_flow
pnpm run prisma:generate
```

Expected: migration created, Prisma Client generated, no schema validation errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(api): add core flow data model"
```

---

## Task 2: Seeder for Demo Users and Flow Data

**Files:**
- Modify: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Add password hash helper**

Use Node `crypto.scryptSync` with stable salts for seeded users.

```ts
import { randomBytes, scryptSync } from 'crypto';

function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
```

- [ ] **Step 2: Seed users**

After puskesmas upserts, add idempotent users:

```ts
const demoUsers = [
  { username: 'bidan', displayName: 'Bidan Sari', role: 'BIDAN_PUSKESMAS' as const, puskesmasId: 'PKM-001' },
  { username: 'ifk', displayName: 'Admin IFK Sleman', role: 'IFK_ADMIN' as const, puskesmasId: null },
  { username: 'admin', displayName: 'Super Admin MaternaLink', role: 'SUPER_ADMIN' as const, puskesmasId: null },
];

for (const user of demoUsers) {
  await prisma.user.upsert({
    where: { username: user.username },
    update: { displayName: user.displayName, role: user.role, puskesmasId: user.puskesmasId, active: true },
    create: { ...user, active: true, passwordHash: hashPassword('password123', `maternalink-${user.username}`) },
  });
}
```

- [ ] **Step 3: Seed core demo rows**

Seed at least:

- Patient `Ny. Anisa Rahmawati`, NIK `3404015203980001`, `PKM-001`.
- Pregnancy id `PREG-DEMO-001`, gestational age `36`, risk `HIGH`.
- Queue row id or stable unique row with queue `A-001`, status `WAITING`.
- Recommendation `REC-DEMO-001`, item `RECITEM-DEMO-001`, tracking `TRACK-DEMO-001`.

Use `upsert` only. Stable IDs required for e2e tests.

- [ ] **Step 4: Run seed twice**

```bash
pnpm run prisma:seed
pnpm run prisma:seed
```

Expected: both runs pass without duplicate errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/seed.ts
git commit -m "feat(api): seed end-to-end demo data"
```

---

## Task 3: Username Auth and Role Guards

**Files:**
- Create: `apps/api/src/common/auth/current-user.ts`
- Create: `apps/api/src/common/auth/auth-utils.ts`
- Create: `apps/api/src/common/auth/roles.decorator.ts`
- Create: `apps/api/src/common/auth/auth.guard.ts`
- Create: `apps/api/src/common/auth/roles.guard.ts`
- Create: `apps/api/src/modules/auth/auth.dto.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/auth.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/test/app.e2e-spec.ts`

- [ ] **Step 1: Add failing auth tests**

Add tests for:

```ts
await request(app.getHttpServer()).post('/api/auth/login').send({ username: 'bidan', password: 'password123' }).expect(201);
await request(app.getHttpServer()).post('/api/auth/login').send({ username: 'bidan', password: 'wrong' }).expect(401);
await request(app.getHttpServer()).get('/api/auth/me').expect(401);
```

Expected first run: auth routes fail with 404.

- [ ] **Step 2: Implement auth utility contract**

`auth-utils.ts` must export exactly:

```ts
export function hashPassword(password: string, salt?: string): string;
export function verifyPassword(password: string, stored: string): boolean;
export function createSessionToken(user: CurrentUser): string;
export function verifySessionToken(token?: string): CurrentUser | null;
export function parseCookies(cookieHeader?: string): Record<string, string>;
export function buildSessionCookie(token: string): string;
export function buildClearSessionCookie(): string;
export function getSessionCookieName(): 'maternalink_session';
```

Use HMAC SHA-256 with `JWT_SECRET ?? 'maternalink-local-dev-secret'` and cookie `maternalink_session; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`.

- [ ] **Step 3: Implement guards**

`AuthGuard` reads raw `Cookie` header, verifies `maternalink_session`, attaches `request.user`, throws 401 on missing/invalid token. `RolesGuard` reads `@Roles(...)` metadata and throws 403 when current role is not allowed.

- [ ] **Step 4: Implement auth module**

Endpoints:

```ts
POST /api/auth/login   // body { username, password }, sets cookie, returns user
POST /api/auth/logout  // clears cookie
GET  /api/auth/me      // requires cookie, returns user
```

Register `AuthModule` in `app.module.ts`.

- [ ] **Step 5: Run tests**

```bash
pnpm run test:e2e
```

Expected: auth tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/common/auth apps/api/src/modules/auth apps/api/src/app.module.ts apps/api/test/app.e2e-spec.ts
git commit -m "feat(api): add username session auth"
```

---

## Task 4: Patient, Queue, and Examination APIs

**Files:**
- Create: `apps/api/src/modules/patients/patients.dto.ts`
- Create: `apps/api/src/modules/patients/patients.service.ts`
- Create: `apps/api/src/modules/patients/patients.controller.ts`
- Create: `apps/api/src/modules/patients/patients.module.ts`
- Create: `apps/api/src/modules/queue/queue.dto.ts`
- Create: `apps/api/src/modules/queue/queue.service.ts`
- Create: `apps/api/src/modules/queue/queue.controller.ts`
- Create: `apps/api/src/modules/queue/queue.module.ts`
- Create: `apps/api/src/modules/examinations/examinations.dto.ts`
- Create: `apps/api/src/modules/examinations/examinations.service.ts`
- Create: `apps/api/src/modules/examinations/examinations.controller.ts`
- Create: `apps/api/src/modules/examinations/examinations.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/test/app.e2e-spec.ts`

- [ ] **Step 1: Add failing vertical API test**

Add one e2e test that logs in as `bidan`, then calls:

```ts
POST /api/patients
POST /api/queue
PATCH /api/queue/:id/status  // EXAMINING
POST /api/examinations
GET /api/queue/today
```

Payload requirements:

```ts
{ fullName: 'Ny. Test Flow', nik: '3404015203989999', gestationalAge: 28, ancVisit: 'K3', riskLevel: 'MEDIUM' }
{ status: 'EXAMINING' }
{ complaint: 'Pusing dan bengkak kaki', diagnosis: [{ kondisiId: 'K03', jumlahKasus: 1 }], symptoms: [{ gejalaId: 'G05', jumlah: 1 }] }
```

Expected first run: 404 for `/api/patients`.

- [ ] **Step 2: Implement DTOs**

DTO classes and required fields:

```ts
CreatePatientDto: fullName string, nik string, phone optional, address optional, gestationalAge optional number, ancVisit optional string, riskLevel optional PregnancyRiskLevel
CreateQueueDto: patientId string, pregnancyId string
UpdateQueueStatusDto: status QueueStatus, assignedDoctor optional string
CreateExaminationDto: queueId optional, patientId string, pregnancyId string, complaint optional, gestationalAge optional number, ancVisit optional, diagnosis optional array, symptoms optional array, medication optional array, notes optional string
```

Use `class-validator`. Keep `ValidationPipe` behavior compatible with existing e2e setup.

- [ ] **Step 3: Implement patients service/controller**

Rules:

- `POST /api/patients` requires `BIDAN_PUSKESMAS` or `SUPER_ADMIN`.
- Puskesmas id comes from current user for bidan.
- Creates `Patient` and active `Pregnancy` in one transaction.
- `GET /api/patients` returns patient list with active pregnancy.
- `GET /api/patients/:id` returns patient detail with pregnancies and recent examinations.

- [ ] **Step 4: Implement queue service/controller**

Rules:

- `POST /api/queue` requires `BIDAN_PUSKESMAS` or `SUPER_ADMIN`.
- Queue number is next `A-###` for current puskesmas/day.
- `GET /api/queue/today` scopes to current user's puskesmas unless `SUPER_ADMIN` passes query.
- Valid transitions:

```ts
WAITING -> EXAMINING | CANCELLED
EXAMINING -> COMPLETED | CANCELLED
COMPLETED -> no transition
CANCELLED -> no transition
```

Invalid transition returns 409.

- [ ] **Step 5: Implement examinations service/controller**

Rules:

- `POST /api/examinations` requires `BIDAN_PUSKESMAS` or `SUPER_ADMIN`.
- Saves `Examination` with source `MANUAL` unless voice fallback flag is passed.
- Upserts `DiagnosisPeriode` rows for submitted diagnosis.
- Upserts `GejalaPeriode` rows for submitted symptoms.
- Creates `AnamnesisRaw` when complaint exists.
- Marks linked queue `COMPLETED`.

- [ ] **Step 6: Register modules and run tests**

Register `PatientsModule`, `QueueModule`, and `ExaminationsModule` in `app.module.ts`.

Run:

```bash
pnpm run test:e2e
```

Expected: vertical API test passes.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/patients apps/api/src/modules/queue apps/api/src/modules/examinations apps/api/src/app.module.ts apps/api/test/app.e2e-spec.ts
git commit -m "feat(api): add patient queue examination flow"
```

---

## Task 5: Distribution Recommendation APIs and Drag Reorder

**Files:**
- Modify: `apps/api/src/modules/distribution/distribution.dto.ts`
- Modify: `apps/api/src/modules/distribution/distribution.service.ts`
- Modify: `apps/api/src/modules/distribution/distribution.controller.ts`
- Test: `apps/api/test/app.e2e-spec.ts`

- [ ] **Step 1: Add failing distribution e2e tests**

Add tests for:

```ts
bidan PATCH /api/distribution/recommendations/REC-DEMO-001/approve -> 403
ifk PATCH /api/distribution/recommendations/REC-DEMO-001/items/RECITEM-DEMO-001 with { overrideQuantity: 15 } -> 400
ifk PATCH same item with { overrideQuantity: 15, overrideReason: 'Reserve stock retained at IFK' } -> 200
ifk PATCH /api/distribution/recommendations/reorder with { orderedIds: ['REC-DEMO-001'] } -> 200 and priorityRank 1
ifk PATCH /api/distribution/recommendations/REC-DEMO-001/approve -> 200 and status APPROVED
```

- [ ] **Step 2: Add DTOs**

Add classes:

```ts
UpdateRecommendationItemDto: overrideQuantity number min 0, overrideReason optional string
ReorderRecommendationsDto: orderedIds string[]
RejectRecommendationDto: note optional string
TrackingEventDto: status TrackingStatus, note optional string
```

- [ ] **Step 3: Implement recommendation service methods**

Methods required:

```ts
listRecommendations(filters)
getRecommendation(id)
updateRecommendationItem(itemId, dto)
reorderRecommendations(orderedIds)
approveRecommendation(id, actorUserId)
rejectRecommendation(id, actorUserId, note)
getTracking(id)
addTrackingEvent(id, actorUserId, dto)
```

Rules:

- Override quantity requires non-empty reason.
- Reorder updates `priorityRank = index + 1` in transaction.
- Reorder updates `routeSummary` with deterministic recalculated marker.
- Approve/reject create `ShipmentTrackingEvent`.
- IFK mutations require `IFK_ADMIN` or `SUPER_ADMIN`.

- [ ] **Step 4: Add controller endpoints**

Expose:

```ts
GET /api/distribution/recommendations
GET /api/distribution/recommendations/:id
PATCH /api/distribution/recommendations/reorder
PATCH /api/distribution/recommendations/:id/items/:itemId
PATCH /api/distribution/recommendations/:id/approve
PATCH /api/distribution/recommendations/:id/reject
GET /api/distribution/recommendations/:id/tracking
POST /api/distribution/recommendations/:id/tracking/events
```

- [ ] **Step 5: Run tests and commit**

```bash
pnpm run test:e2e
git add apps/api/src/modules/distribution apps/api/test/app.e2e-spec.ts
git commit -m "feat(api): add distribution recommendation workflow"
```

---

## Task 6: FastAPI Scaffold and AI Gateway

**Files:**
- Create: `apps/ai-service/requirements.txt`
- Create: `apps/ai-service/main.py`
- Create: `apps/ai-service/Dockerfile`
- Modify: `docker-compose.yml`
- Create: `apps/api/src/modules/ai/ai.service.ts`
- Create: `apps/api/src/modules/ai/ai.controller.ts`
- Create: `apps/api/src/modules/ai/ai.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/test/app.e2e-spec.ts`

- [ ] **Step 1: Create FastAPI stub**

`requirements.txt` exact content:

```txt
fastapi==0.115.6
uvicorn[standard]==0.32.1
pydantic==2.10.3
```

`main.py` must expose:

```py
GET /health -> { service, version, status }
POST /layer0/extract-symptoms -> { source: 'FASTAPI_STUB', modelVersion: 'stub-v1', symptoms: [...] }
POST /layer1/forecast-demand -> { source: 'FASTAPI_STUB', modelVersion: 'stub-v1', predictions: [] }
POST /layer2/allocate -> { source: 'FASTAPI_STUB', modelVersion: 'stub-v1', allocations: [] }
POST /layer2/explain -> { source: 'FASTAPI_STUB', modelVersion: 'stub-v1', explanation: string }
```

`Dockerfile` runs `uvicorn main:app --host 0.0.0.0 --port 8000`.

- [ ] **Step 2: Wire Docker Compose**

Add `ai-service` service on `8000:8000`. Add API env:

```yaml
AI_SERVICE_BASE_URL: http://ai-service:8000
AI_MODE: fallback
AI_SERVICE_TIMEOUT_MS: 30000
```

- [ ] **Step 3: Add NestJS AI module**

`GET /api/ai/health` returns fallback health when `AI_MODE !== 'remote'`:

```ts
{ mode: 'fallback', remote: false, status: 'fallback-ready' }
```

When `AI_MODE=remote`, call `${AI_SERVICE_BASE_URL}/health`; catch errors and return `{ status: 'unavailable' }` instead of throwing.

- [ ] **Step 4: Add tests and smoke command**

Add e2e test:

```ts
GET /api/ai/health -> 200 with status fallback-ready
```

Run FastAPI smoke:

```bash
cd apps/ai-service
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
curl http://127.0.0.1:8000/health
```

Expected: JSON status `ok`.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm run test:e2e
git add apps/ai-service docker-compose.yml apps/api/src/modules/ai apps/api/src/app.module.ts apps/api/test/app.e2e-spec.ts
git commit -m "feat: add FastAPI stub and AI gateway"
```

---

## Task 7: Workflow and Dashboard Summary APIs

**Files:**
- Create: `apps/api/src/modules/workflow/workflow.controller.ts`
- Create: `apps/api/src/modules/workflow/workflow.service.ts`
- Create: `apps/api/src/modules/workflow/workflow.module.ts`
- Create: `apps/api/src/modules/dashboard/dashboard.controller.ts`
- Create: `apps/api/src/modules/dashboard/dashboard.service.ts`
- Create: `apps/api/src/modules/dashboard/dashboard.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/test/app.e2e-spec.ts`

- [ ] **Step 1: Add failing tests**

Test:

```ts
POST /api/workflow/demo/run as bidan -> 201 creates forecast/lplpo/recommendation with source RULE_BASED_FALLBACK
GET /api/workflow/demo/state as bidan -> 200
GET /api/dashboard/summary as bidan -> queue and stock metrics
GET /api/dashboard/summary as ifk -> recommendation metrics
```

- [ ] **Step 2: Implement workflow service**

Workflow runner:

1. Ensures stock/context exist for `PKM-001` and period `2026-06-01`.
2. Calls existing `ForecastService.run` or equivalent logic.
3. Calls existing `LplpoService.generate`.
4. Upserts one or more `DistributionRecommendation` rows from LPLPO output.
5. Writes `AuditLog` action `workflow.demo.run`.

- [ ] **Step 3: Implement dashboard summary**

Bidan response shape:

```ts
{ role: 'BIDAN_PUSKESMAS', queue: { waiting, examining, completed }, patients: { total }, medicine: { criticalCount } }
```

IFK response shape:

```ts
{ role: 'IFK_ADMIN', recommendations: { pending, approved, rejected, critical }, deliveries: { active } }
```

- [ ] **Step 4: Run tests and commit**

```bash
pnpm run test:e2e
git add apps/api/src/modules/workflow apps/api/src/modules/dashboard apps/api/src/app.module.ts apps/api/test/app.e2e-spec.ts
git commit -m "feat(api): add demo workflow and dashboard summary"
```

---

## Task 8: Frontend API Client, Auth State, and Route Rename

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/lib/routes.ts`
- Modify: `apps/web/next.config.ts`
- Modify: `apps/web/src/components/layout/app-shell.tsx`
- Modify: `apps/web/src/components/layout/sidebar.tsx`
- Modify: `apps/web/src/features/login/login-page-content.tsx`
- Create/move page files under new route paths.

- [ ] **Step 1: Create route constants**

Create `routes.ts`:

```ts
export const routes = {
  login: '/login',
  dashboard: '/dashboard',
  patients: '/patients',
  newPatient: '/patients/new',
  manualPatient: '/patients/new/manual',
  kiaUpload: '/patients/new/kia-upload',
  queue: '/queue',
  examination: '/queue/examination',
  forecastCalendar: '/forecast-calendar',
  medicineNeeds: '/medicine-needs',
  deliveries: '/deliveries',
  ifk: '/ifk',
  ifkRecommendations: '/ifk/recommendations',
  ifkClinics: '/ifk/clinics',
  ifkEnvironment: '/ifk/environment',
  ifkDecisionHistory: '/ifk/decision-history',
} as const;
```

- [ ] **Step 2: Add old-route redirects**

Use `next.config.ts` redirects:

```ts
async redirects() {
  return [
    { source: '/', destination: '/dashboard', permanent: false },
    { source: '/master', destination: '/patients', permanent: false },
    { source: '/master/add-patient', destination: '/patients/new', permanent: false },
    { source: '/master/add-patient/manual', destination: '/patients/new/manual', permanent: false },
    { source: '/master/add-patient/upload', destination: '/patients/new/kia-upload', permanent: false },
    { source: '/inputs', destination: '/queue', permanent: false },
    { source: '/inputs/examination', destination: '/queue/examination', permanent: false },
    { source: '/forecast', destination: '/forecast-calendar', permanent: false },
    { source: '/lplpo', destination: '/medicine-needs', permanent: false },
    { source: '/distribution', destination: '/deliveries', permanent: false },
    { source: '/medicine-sender', destination: '/ifk', permanent: false },
    { source: '/medicine-sender/recommendations', destination: '/ifk/recommendations', permanent: false },
    { source: '/medicine-sender/clinics', destination: '/ifk/clinics', permanent: false },
    { source: '/medicine-sender/environment', destination: '/ifk/environment', permanent: false },
    { source: '/medicine-sender/decision-history', destination: '/ifk/decision-history', permanent: false },
  ];
}
```

- [ ] **Step 3: Extend API client**

`api.ts` must expose:

```ts
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T>;
export async function login(username: string, password: string): Promise<CurrentUser>;
export async function logout(): Promise<void>;
export async function getCurrentUser(): Promise<CurrentUser | null>;
```

Set `credentials: 'include'`, `cache: 'no-store'`, and throw `Error(message)` for non-2xx responses.

- [ ] **Step 4: Wire login page**

Update login form to use username/password state. On submit:

```ts
const user = await login(username, password);
router.replace(user.role === 'IFK_ADMIN' ? routes.ifkRecommendations : routes.queue);
```

Show loading, invalid login error, and disabled submit while loading.

- [ ] **Step 5: Role-aware app shell/sidebar**

App shell loads `/auth/me`. If no user and path is not `/login`, redirect `/login`. Sidebar items:

```ts
BIDAN_PUSKESMAS: dashboard, queue, patients, forecastCalendar, medicineNeeds
IFK_ADMIN: ifk, ifkRecommendations, ifkClinics, ifkEnvironment, ifkDecisionHistory, deliveries
SUPER_ADMIN: all items
```

- [ ] **Step 6: Create new page files**

New page files should re-export existing content components first, before deeper rewrites. Example:

```tsx
import { PatientQueueContent } from '@/features/patient-queue/patient-queue-content';
export default function QueuePage() { return <PatientQueueContent />; }
```

- [ ] **Step 7: Build web and commit**

```bash
pnpm run build:web
git add apps/web/src/lib apps/web/next.config.ts apps/web/src/app apps/web/src/components/layout apps/web/src/features/login
git commit -m "feat(web): add auth routes and role navigation"
```

---

## Task 9: Registration, Queue, and Examination UI Integration

**Files:**
- Modify: `apps/web/src/features/patient-registration/manual-entry-flow-content.tsx`
- Modify: `apps/web/src/features/patient-registration/upload-kia-book-content.tsx`
- Modify: `apps/web/src/features/patient-queue/patient-queue-content.tsx`
- Modify: `apps/web/src/features/patient-examination/patient-examination-content.tsx`
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Add domain client helpers**

Add helpers:

```ts
createPatient(payload)
createQueue(payload)
getTodayQueue(params?)
updateQueueStatus(id, status)
createExamination(payload)
```

- [ ] **Step 2: Manual registration form**

Convert required fields to controlled state. Validate before final submit:

```ts
fullName, nik, phone, address, gestationalAge, ancVisit
```

On final submit:

```ts
const created = await createPatient(payload);
await createQueue({ patientId: created.patient.id, pregnancyId: created.pregnancy.id });
router.push(routes.queue);
```

Keep next/back stage behavior and preserve state across stages.

- [ ] **Step 3: KIA upload simulated extraction with real file state**

Required interactions:

- file input opens file picker.
- preview displays selected file name and image preview when possible.
- reset clears file and extraction state.
- confirm submits extracted review values through `createPatient` and `createQueue`.

- [ ] **Step 4: Queue page dynamic data**

Replace static `patients` array with API data. Implement:

- search by name/NIK.
- filter by risk/status/doctor.
- reset/apply filter controls.
- pagination from local filtered rows.
- `Call` does `updateQueueStatus(id, 'EXAMINING')` then navigates to `/queue/examination?queueId=id`.
- `Complete` does `updateQueueStatus(id, 'COMPLETED')` then refreshes rows.

- [ ] **Step 5: Examination page dynamic form**

Read `queueId` from URL. Load queue context. Convert static spans to editable inputs/selects/textareas. Save calls `createExamination`, then navigates to `/forecast-calendar` or shows success action.

Voice fallback behavior:

- `Start Recording` shows recording UI.
- `Finish Recording` fills form fields with deterministic fallback values and source `VOICE_TRANSCRIPT_FALLBACK`.
- No microphone API required in v1.

- [ ] **Step 6: Build and commit**

```bash
pnpm run build:web
git add apps/web/src/features/patient-registration apps/web/src/features/patient-queue apps/web/src/features/patient-examination apps/web/src/lib/api.ts
git commit -m "feat(web): connect patient registration queue examination flow"
```

---

## Task 10: Forecast, Medicine Needs, IFK Recommendation UI Integration

**Files:**
- Modify: `apps/web/src/features/calendar/calendar-prediction-content.tsx`
- Modify: `apps/web/src/features/medicine/medicine-needs-content.tsx`
- Modify: `apps/web/src/features/medicine-sender/medicine-sender-recommendations-content.tsx`
- Modify: `apps/web/src/features/medicine-sender/decision-history-content.tsx`
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Add API helpers**

Add helpers:

```ts
runDemoWorkflow()
getDemoWorkflowState()
getForecastRuns()
getLplpoRows(params?)
getRecommendations(filters?)
updateRecommendationItem(recommendationId, itemId, payload)
reorderRecommendations(orderedIds)
approveRecommendation(id)
rejectRecommendation(id, note?)
getRecommendationTracking(id)
addTrackingEvent(id, payload)
```

- [ ] **Step 2: Forecast calendar interactions**

Implement month prev/next state. Selected period drives API calls. Run/prepare button calls `runDemoWorkflow`, shows loading/error/success, refreshes latest forecast state.

- [ ] **Step 3: Medicine needs dynamic table**

Read LPLPO rows from API. Edit stock modal persists values. Upload document flow has file select, preview, reset, confirm, and then updates form/table state. Shipment request creates backend request or recommendation state.

- [ ] **Step 4: IFK recommendations dynamic table**

Replace static rows with API rows. Implement filters for urgency/status/district/date. Approve/reject modals call API and refresh rows. Edit modal requires override reason before save.

- [ ] **Step 5: Drag-and-drop reorder**

Use native drag/drop:

```tsx
<tr draggable onDragStart={() => setDraggingId(row.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => handleDrop(row.id)}>
```

On drop:

1. Reorder local array optimistically.
2. Call `reorderRecommendations(orderedIds)`.
3. Replace local rows with server response.
4. On error, restore previous rows and show error.

Add keyboard fallback buttons:

```tsx
<button aria-label="Move up" onClick={() => moveRow(row.id, -1)} />
<button aria-label="Move down" onClick={() => moveRow(row.id, 1)} />
```

- [ ] **Step 6: Decision history dynamic data**

Read recommendations with final statuses. Show final quantity, override reason, actor/timestamp from tracking events, and source.

- [ ] **Step 7: Build and commit**

```bash
pnpm run build:web
git add apps/web/src/features/calendar apps/web/src/features/medicine apps/web/src/features/medicine-sender apps/web/src/lib/api.ts
git commit -m "feat(web): connect forecast medicine and IFK workflows"
```

---

## Task 11: No-Op Button Audit and Holding States

**Files:**
- Modify any touched frontend feature files with silent buttons.

- [ ] **Step 1: Find candidate no-op controls**

Run:

```bash
rg -n "<button|Button" apps/web/src/features apps/web/src/components apps/web/src/app
```

For each visible core-flow control, classify as API action, state action, navigation, disabled holding state, or non-core future control.

- [ ] **Step 2: Add holding action helper**

Add a small local helper in touched components:

```ts
function showNextPhaseNotice(label: string) {
  window.alert(`${label} akan tersedia pada fase berikutnya.`);
}
```

Use only for controls not in v1 scope. Prefer real action or disabled state when possible.

- [ ] **Step 3: Verify core controls manually**

Manual checklist:

- Login submit.
- Registration next/back/submit.
- KIA upload choose/reset/confirm.
- Queue search/filter/pagination/call/complete/view details.
- Examination manual/voice/save.
- Forecast prev/next/run.
- Medicine edit/upload/request.
- Recommendation filter/edit/approve/reject/track/drag-drop/up/down.

- [ ] **Step 4: Build and commit**

```bash
pnpm run build:web
git add apps/web/src
git commit -m "fix(web): remove silent core flow actions"
```

---

## Task 12: Final Verification and Docs Update

**Files:**
- Modify: `README.md`
- Modify: `apps/api/test/app.e2e-spec.ts` if gaps remain.

- [ ] **Step 1: Full backend verification**

Run:

```bash
pnpm run prisma:generate
pnpm run prisma:seed
pnpm run test:e2e
pnpm run build:api
```

Expected: all commands exit 0.

- [ ] **Step 2: Full frontend verification**

Run:

```bash
pnpm run build:web
```

Expected: Next build exits 0.

- [ ] **Step 3: Docker verification**

Run:

```bash
docker compose up --build
```

Expected:

- Web available at `http://localhost:3000/login`.
- API available at `http://localhost:3001/api/docs`.
- FastAPI available at `http://localhost:8000/health`.
- Login `bidan/password123` works.
- Login `ifk/password123` works.

- [ ] **Step 4: Manual smoke flow**

In browser:

1. Login as `bidan/password123`.
2. Open `/patients/new/manual`.
3. Register patient and confirm redirect to `/queue`.
4. Call patient and save examination.
5. Open `/forecast-calendar` and run workflow.
6. Open `/medicine-needs` and verify dynamic LPLPO rows.
7. Logout, login as `ifk/password123`.
8. Open `/ifk/recommendations`.
9. Drag a row, refresh, verify order persists.
10. Edit quantity with reason.
11. Approve or reject.
12. Open tracking and decision history.

- [ ] **Step 5: README update**

Update README with:

- demo users.
- new route names.
- FastAPI stub setup.
- `AI_MODE=fallback|remote` behavior.
- Docker Compose service list.

- [ ] **Step 6: Final status commit**

```bash
git add README.md apps/api/test/app.e2e-spec.ts
git commit -m "docs: document end-to-end demo flow"
```

---

## Plan Self-Review

Spec coverage:

- Auth/role with username login: Task 3 and Task 8.
- One mature end-to-end flow: Tasks 4, 7, 9, 10, 12.
- FastAPI future setup: Task 6.
- Seeder-backed data: Task 2.
- Dynamic hardcoded core pages: Tasks 9 and 10.
- Drag-and-drop and no-op buttons: Tasks 10 and 11.
- Route renaming: Task 8.
- Tests and verification: Tasks 3 through 12.

No intentional gaps remain in the plan. Implementation workers must not skip the test-first steps.
