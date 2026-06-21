<div align="center">

# MaternaLink

Full-stack maternal health operations app for patient intake, ANC examination, medicine needs forecasting, LPLPO planning, IFK allocation, and distribution risk simulation.

![NestJS](https://img.shields.io/badge/NestJS-10.4-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

## Overview

MaternaLink models an end-to-end puskesmas and IFK workflow from patient registration to AI-assisted medicine allocation. The repository contains:

- NestJS REST API with Prisma and PostgreSQL.
- Next.js dashboard for bidan, IFK, and super admin workflows.
- Docker Compose stack for local API, web, speech-to-text service, and database.
- Hosted AI integration with deterministic fallbacks for presentation-ready flows.
- Demo seed data and e2e tests.

Default local URLs:

| Service | URL |
|---|---|
| Web dashboard | `http://localhost:3000` |
| API base | `http://localhost:3001/api` |
| Swagger docs | `http://localhost:3001/api/docs` |
| Hosted AI API | `https://azrilfahmiardi-maternalink-ai.hf.space` |
| Speech STT service | `http://localhost:8002` |
| PostgreSQL | `localhost:55432` |

Production ports used by `podman-compose.prod.yml`:

| Service | Host port |
|---|---:|
| Web | `41873` |
| API | `41874` |
| Speech STT | `41875` |

## Demo Login

Seeded users all use password `password123`.

| Username | Role | Landing route |
|---|---|---|
| `admin` | `SUPER_ADMIN` | `/admin` |
| `bidan` | `BIDAN_PUSKESMAS` | `/dashboard` |
| `ifk` | `IFK_ADMIN` | `/ifk` |

## Features

- Puskesmas, medicine, clinical condition, and symptom master data.
- Session-cookie authentication with role-based dashboard routing.
- Super admin screens for users, health centers, medicine list, and facility profiles.
- Patient registration with dynamic fields, pregnancy profile, patient queue, and examination records.
- Monthly diagnosis, symptom, context, stock, and anamnesis inputs.
- Deterministic demand forecast per puskesmas and period.
- Hosted AI demand forecast with local fallback when the remote service is unavailable.
- Async hosted AI workflow jobs for forecast, LPLPO, and IFK recommendation generation.
- Voice examination recording through browser microphone and local speech-to-text service.
- Predictive LPLPO generation from forecast output.
- IFK recommendation review with reorder, quantity edit, approve/reject, revision request, and shipment tracking.
- Allocation plan simulation with weather, route disruption, and cold-chain alerts.
- Responsive dashboard pages for overview, queue, patients, forecast calendar, medicine needs, delivery, IFK, and admin flows.

## Tech Stack

| Area | Stack |
|---|---|
| Monorepo | pnpm workspace |
| API | NestJS 10, TypeScript, Swagger |
| Database | PostgreSQL 16, Prisma 5 |
| Web | Next.js 15, React 18, Ant Design 5, Leaflet |
| Auth | HMAC signed `maternalink_session` cookie, role guard middleware |
| Test | Jest, Supertest |
| Local runtime | Docker Compose, Python speech STT container |
| Production runtime | GitHub Actions, GHCR images, Podman Compose |

## Repository Structure

```text
.
+-- apps
|   +-- api          # NestJS API, Prisma schema, migrations, seed, e2e test
|   +-- web          # Next.js dashboard and UI assets
+-- services
|   +-- speech-stt   # Python/FastAPI speech-to-text service
+-- docker-compose.yml
+-- Dockerfile       # API Docker build
+-- podman-compose.prod.yml
+-- package.json     # Root pnpm scripts
+-- pnpm-workspace.yaml
```

## Quick Start With Docker

Requirements:

- Docker Desktop
- pnpm only needed if you also run local host commands

Run full stack:

```bash
docker compose up --build
```

Compose starts:

1. PostgreSQL on host port `55432`.
2. API on host port `3001`.
3. Web dashboard on host port `3000`.
4. Speech STT service on host port `8002`.
5. Prisma migrations through API entrypoint.
6. Demo seed data when `RUN_SEED=true`.

Stop stack:

```bash
docker compose down
```

Reset database volume:

```bash
docker compose down -v
docker compose up --build
```

## Local Development

Requirements:

- Node.js 20 or newer
- pnpm
- Docker Desktop for PostgreSQL

Install dependencies:

```bash
pnpm install
```

Create env files:

```bash
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env
```

The API also reads a root `.env` for shared deployment values such as `JWT_SECRET`, `WEB_ORIGIN`, and AI/STT URLs. Values in the process environment take precedence over file values.

Start PostgreSQL only:

```bash
docker compose up -d postgres
```

Generate Prisma client, run migration, and seed demo data:

```bash
pnpm run prisma:generate
pnpm run prisma:migrate -- --name init_normalized_schema
pnpm run prisma:seed
```

Run API and web in one command:

```bash
pnpm run dev
```

Or run separately:

```bash
pnpm run dev:api
pnpm run dev:web
```

## Environment Variables

### API

File: `apps/api/.env`

| Variable | Required | Default/example | Description |
|---|:---:|---|---|
| `DATABASE_URL` | Yes | `postgresql://maternalink:maternalink@localhost:55432/maternalink?schema=public` | Prisma PostgreSQL connection string. |
| `JWT_SECRET` | Recommended | development fallback | Secret used to sign the `maternalink_session` cookie. Set this in production. |
| `PORT` | No | `3001` | NestJS HTTP port. |
| `RUN_SEED` | No | `true` | Docker entrypoint runs seed data when set to `true`. |
| `WEB_ORIGIN` | No | `http://localhost:3000` | CORS origin allowed to send credentialed auth requests. |
| `AI_MODE` | No | `remote` | `remote` calls the hosted Hugging Face AI API; `fallback` skips external calls for offline development. |
| `AI_SERVICE_BASE_URL` | No | `https://azrilfahmiardi-maternalink-ai.hf.space` | Hosted MaternaLink AI base URL. |
| `AI_SERVICE_TIMEOUT_MS` | No | `30000` | Timeout for health, Layer 0, and Layer 1 AI calls. |
| `AI_LAYER2_TIMEOUT_MS` | No | `600000` | Timeout for long Layer 2 allocation calls. |
| `AI_MASTER_AUTO_SYNC` | No | `true` | Enables automatic hosted AI master-data sync on API startup and schedule. Set to `false` to disable. |
| `AI_MASTER_SYNC_INTERVAL_MS` | No | `86400000` | Interval for automatic hosted AI master-data sync. |
| `OPEN_METEO_FORECAST_URL` | No | `https://api.open-meteo.com/v1/forecast` | Weather forecast endpoint for distribution route risk simulation. |
| `OPEN_METEO_TIMEOUT_MS` | No | `7000` | Timeout for Open-Meteo calls. |
| `SPEECH_STT_SERVICE_URL` | No | `http://localhost:8002` | Python speech-to-text service used for voice examination recording. |
| `SPEECH_STT_TIMEOUT_MS` | No | `120000` | Timeout for speech-to-text transcription calls. |
| `SESSION_COOKIE_SECURE` | No | `false` | Set to `true` only when serving the app through HTTPS. |

### Web

File: `apps/web/.env`

| Variable | Required | Default/example | Description |
|---|:---:|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | No | `http://localhost:3001/api` locally, `/api` in production | Browser-facing API base URL used by the dashboard. |
| `API_INTERNAL_BASE_URL` | No | `http://localhost:3001/api` locally, `http://api:3001/api` in containers | Server-side Next.js rewrite target for `/api/:path*`. |
| `JWT_SECRET` | Recommended | development fallback | Must match API `JWT_SECRET` so middleware can verify the session cookie. |

In production, `NEXT_PUBLIC_API_BASE_URL=/api` lets the web container proxy API calls through the Next.js rewrite to `API_INTERNAL_BASE_URL`. This avoids exposing the internal API hostname to the browser.

Do not commit real production credentials or secrets.

## Root Scripts

| Command | Description |
|---|---|
| `pnpm run dev` | Run API and web dev servers in parallel. |
| `pnpm run dev:api` | Run NestJS API in watch mode. |
| `pnpm run dev:web` | Run Next.js dashboard on port `3000`. |
| `pnpm run build` | Build API then web. |
| `pnpm run build:api` | Build API only. |
| `pnpm run build:web` | Build web only. |
| `pnpm run start:api` | Start compiled API from `dist`. |
| `pnpm run test:e2e` | Run API e2e tests. |
| `pnpm run prisma:generate` | Generate Prisma client. |
| `pnpm run prisma:migrate` | Run Prisma dev migration. |
| `pnpm run prisma:deploy` | Deploy existing Prisma migrations. |
| `pnpm run prisma:seed` | Seed demo data. |

## Web Pages

| Route | Purpose |
|---|---|
| `/login` | Username/password login. |
| `/admin` | Super admin dashboard. |
| `/admin/users` | User account management. |
| `/admin/health-centers` | Puskesmas/health-center master data. |
| `/admin/medicines` | Medicine master data. |
| `/admin/facility-profiles` | Facility profile and readiness data. |
| `/dashboard` | Main dashboard overview. |
| `/patients` | Patient list. |
| `/patients/new` | Add patient method selection. |
| `/patients/new/manual` | Manual patient registration. |
| `/queue` | Patient queue. |
| `/queue/examination` | Patient examination form. |
| `/forecast-calendar` | Prediction calendar and demo workflow runner. |
| `/medicine-needs` | Medicine needs/LPLPO view. |
| `/deliveries` | Distribution workflow route. |
| `/ifk` | IFK dashboard. |
| `/ifk/recommendations` | IFK recommendation review with drag/drop reorder. |
| `/ifk/clinics` | Clinic delivery context. |
| `/ifk/environment` | Environment/risk context view. |
| `/ifk/decision-history` | Decision history view. |

Role entry routes are `/admin` for super admin, `/dashboard` for bidan, and `/ifk` for IFK.

## Hosted AI Integration

The backend calls the hosted MaternaLink AI API directly. The frontend never calls Hugging Face directly.

For Layer 1 forecast, the API automatically falls back to a local deterministic forecast when `AI_MODE` is not `remote`, or when the hosted AI forecast endpoint returns an error or times out. This keeps `/api/forecast/ai/run` usable during demos even if the remote AI service is unavailable.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service status. |
| `POST` | `/api/v1/layer0/extract` | Symptom extraction and condition estimates. |
| `POST` | `/api/v1/layer1/forecast` | Drug demand forecast per facility and medicine. |
| `POST` | `/api/v1/layer2/allocate` | Equitable allocation and justifications. |

Voice examination recording is handled by a separate local Python service at `services/speech-stt`. The web app records audio with `MediaRecorder`, uploads it to the Nest API (`POST /api/speech/transcribe`), then the API proxies the audio to `SPEECH_STT_SERVICE_URL/v1/stt/transcribe` and returns a transcript plus draft examination fields for review.

Browser microphone access only works on secure origins: `https://...` or `localhost`. If the deployed app is opened through plain `http://IP:port`, browsers will block `getUserMedia`; use HTTPS/domain for production voice recording.

Layer 2 may take several minutes, so `/api/workflow/demo/run` and `/api/workflow/ai/run` start async backend jobs. Poll `/api/workflow/demo/state` or `/api/workflow/ai/state` for progress and final recommendation output.

## Production Deploy

Pushes to `main` run `.github/workflows/deploy-vps.yml`.

The workflow:

1. Builds API, web, and speech STT images.
2. Pushes them to GitHub Container Registry.
3. SSHes into the VPS.
4. Pulls the exact commit-tagged images.
5. Starts `podman-compose.prod.yml` with API on `41874`, web on `41873`, and speech STT on `41875`.

Current production setup expects a reverse proxy, such as Caddy, to terminate HTTP/HTTPS and forward:

| Public path | Upstream |
|---|---|
| `/` | web `127.0.0.1:41873` |
| `/api/*` | API `127.0.0.1:41874` |
| `/docs` or `/api/docs` | API Swagger docs |

Production requires `POSTGRES_PASSWORD`, `DATABASE_URL`, and `JWT_SECRET`. Keep `WEB_ORIGIN` aligned with the public web origin and set `SESSION_COOKIE_SECURE=true` only when users access the app through HTTPS.

The web Docker image must include `apps/web/public`; static UI assets under `/figma-*` are served from there in production.

## API Modules

All endpoints use the `/api` global prefix.

### Master

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/master/puskesmas` | List puskesmas master data. |
| `POST` | `/api/master/ai/sync` | Sync master data from hosted AI service. |
| `GET` | `/api/master/ai/sync/status` | Get latest hosted AI master-data sync state. |
| `POST` | `/api/master/puskesmas` | Create puskesmas master data. |
| `PATCH` | `/api/master/puskesmas/:id` | Update puskesmas master data. |
| `DELETE` | `/api/master/puskesmas/:id` | Delete puskesmas master data. |
| `GET` | `/api/master/obat` | List medicine master data. |
| `POST` | `/api/master/obat` | Create medicine master data. |
| `PATCH` | `/api/master/obat/:id` | Update medicine master data. |
| `DELETE` | `/api/master/obat/:id` | Delete medicine master data. |
| `GET` | `/api/master/kondisi` | List clinical conditions. |
| `GET` | `/api/master/gejala` | List maternal symptoms. |

### Auth, Patients, Queue, Examinations

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login and set `maternalink_session` cookie. |
| `POST` | `/api/auth/logout` | Clear session cookie. |
| `GET` | `/api/auth/me` | Return current authenticated user. |
| `GET` | `/api/auth/users` | List user accounts. |
| `POST` | `/api/auth/users` | Create user account. |
| `PATCH` | `/api/auth/users/:id` | Update user account. |
| `DELETE` | `/api/auth/users/:id` | Delete or deactivate user account. |
| `POST` | `/api/patients` | Create patient and pregnancy profile. |
| `GET` | `/api/patients` | List patients. |
| `GET` | `/api/patients/:id` | Get patient detail. |
| `PATCH` | `/api/patients/:id` | Update patient. |
| `DELETE` | `/api/patients/:id` | Delete patient. |
| `POST` | `/api/queue` | Add patient to queue. |
| `GET` | `/api/queue/today` | List today's queue. |
| `GET` | `/api/queue` | List queue entries. |
| `PATCH` | `/api/queue/:id/status` | Update queue status. |
| `DELETE` | `/api/queue/:id` | Remove queue entry. |
| `POST` | `/api/examinations` | Create examination. |
| `POST` | `/api/examinations/ai/draft` | Generate draft examination fields from text/transcript. |
| `GET` | `/api/examinations` | List examinations. |
| `GET` | `/api/examinations/:id` | Get examination detail. |
| `PATCH` | `/api/examinations/:id` | Update examination. |
| `DELETE` | `/api/examinations/:id` | Delete examination. |
| `POST` | `/api/speech/transcribe` | Transcribe uploaded audio through the speech STT service. |

### Inputs

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/inputs/diagnosis` | Upsert monthly diagnosis input. |
| `POST` | `/api/inputs/gejala` | Upsert monthly symptom input. |
| `POST` | `/api/inputs/konteks` | Upsert monthly puskesmas context input. |
| `POST` | `/api/inputs/stok` | Upsert monthly medicine stock input. |
| `POST` | `/api/inputs/anamnesis` | Create raw anamnesis transcript input. |

### Forecast, LPLPO, Distribution

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/forecast/run` | Run deterministic stock forecast. |
| `POST` | `/api/forecast/ai/run` | Run hosted AI forecast for current user scope with fallback behavior. |
| `GET` | `/api/forecast/calendar` | Get forecast calendar state for dashboard workflow. |
| `GET` | `/api/forecast/runs` | List forecast runs. |
| `GET` | `/api/forecast/runs/:id/results` | Get forecast result rows. |
| `POST` | `/api/workflow/demo/run` | Start default hosted AI demo workflow. |
| `GET` | `/api/workflow/demo/state` | Poll default hosted AI demo workflow state. |
| `POST` | `/api/workflow/ai/run` | Start hosted AI workflow for selected puskesmas and period. |
| `GET` | `/api/workflow/ai/state` | Poll selected hosted AI workflow state. |
| `POST` | `/api/lplpo/generate` | Generate predictive LPLPO rows from latest forecast. |
| `GET` | `/api/lplpo` | List LPLPO rows, optionally filtered by `puskesmasId` and `periode`. |
| `GET` | `/api/distribution/ifk/dashboard` | IFK dashboard summary. |
| `GET` | `/api/distribution/ifk/facilities` | IFK facility delivery context. |
| `GET` | `/api/distribution/ifk/environment` | IFK environment and route-risk context. |
| `GET` | `/api/distribution/ifk/decision-history` | IFK approval/rejection history. |
| `GET` | `/api/distribution/recommendations` | List IFK allocation recommendations. |
| `GET` | `/api/distribution/recommendations/:id` | Get recommendation detail. |
| `POST` | `/api/distribution/requests` | Submit medicine request. |
| `POST` | `/api/distribution/ifk/ai-allocation` | Generate AI allocation recommendation. |
| `PATCH` | `/api/distribution/recommendations/reorder` | Reorder recommendation priority. |
| `PATCH` | `/api/distribution/recommendations/:id/items/:itemId` | Edit recommendation item quantity/reason. |
| `PATCH` | `/api/distribution/recommendations/:id/approve` | Approve recommendation. |
| `PATCH` | `/api/distribution/recommendations/:id/reject` | Reject recommendation. |
| `POST` | `/api/distribution/recommendations/:id/rerequest` | Request revision for a recommendation. |
| `GET` | `/api/distribution/recommendations/:id/tracking` | List shipment tracking events. |
| `POST` | `/api/distribution/recommendations/:id/tracking/events` | Add shipment tracking event. |
| `GET` | `/api/distribution/alerts` | List distribution alerts. |
| `POST` | `/api/distribution/plans` | Create allocation plan. |
| `GET` | `/api/distribution/plans` | List allocation plans. |
| `GET` | `/api/distribution/plans/:id` | Get allocation plan. |
| `PATCH` | `/api/distribution/plans/:id` | Update allocation plan. |
| `DELETE` | `/api/distribution/plans/:id` | Delete allocation plan. |
| `POST` | `/api/distribution/plans/:id/simulate` | Simulate route and cold-chain risk. |

## Architecture

### Backend Flow

```mermaid
flowchart LR
  A["Master puskesmas, medicine, condition, symptom data"] --> B["Monthly clinical, context, and stock inputs"]
  B --> C["Deterministic or hosted AI forecast"]
  C --> D["Medicine demand prediction"]
  D --> E["Predictive LPLPO"]
  E --> F["IFK allocation recommendation"]
  F --> G["Approve, reject, or request revision"]
  G --> H["Shipment tracking and route risk alerts"]
```

### API Runtime

```mermaid
flowchart LR
  A["Browser"] --> B["Next.js app"]
  B -->|"/api/* rewrite in production"| C["NestJS Controller"]
  D["Swagger / direct API client"] --> C
  C --> E["Service layer"]
  E --> F["Prisma Client"]
  F --> G[("PostgreSQL")]
  E --> H["Hosted MaternaLink AI"]
  E --> I["Speech STT service"]
  E --> J["Open-Meteo forecast API"]
```

### ERD Diagram

```mermaid
erDiagram
  PUSKESMAS ||--o{ DIAGNOSIS_PERIODE : records
  PUSKESMAS ||--o{ GEJALA_PERIODE : records
  PUSKESMAS ||--o{ ANAMNESIS_RAW : records
  PUSKESMAS ||--o{ KONTEKS_PERIODE : contextualizes
  PUSKESMAS ||--o{ STOK_PUSKESMAS : stocks
  PUSKESMAS ||--o{ FORECAST_RUN : forecasts
  PUSKESMAS ||--o{ LPLPO_PREDIKTIF : requests
  PUSKESMAS ||--o{ ALLOCATION_PLAN : receives
  PUSKESMAS ||--o{ ALERT : triggers
  PUSKESMAS ||--o{ USER_ACCOUNT : owns
  PUSKESMAS ||--o{ PATIENT : registers
  PATIENT ||--o{ PREGNANCY : has
  PATIENT ||--o{ PATIENT_QUEUE : queues
  PATIENT ||--o{ EXAMINATION : examines
  OBAT ||--o{ KONDISI_OBAT : treats
  KONDISI ||--o{ KONDISI_OBAT : requires
  GEJALA ||--o{ GEJALA_KONDISI : indicates
  KONDISI ||--o{ GEJALA_KONDISI : suggested_by
  KONDISI ||--o{ DIAGNOSIS_PERIODE : diagnosed
  GEJALA ||--o{ GEJALA_PERIODE : reported
  OBAT ||--o{ STOK_PUSKESMAS : stocked
  FORECAST_RUN ||--o{ PREDIKSI_STOK : produces
  OBAT ||--o{ PREDIKSI_STOK : predicted
  KONDISI ||--o{ PREDIKSI_STOK : explains
  PREDIKSI_STOK ||--o{ LPLPO_PREDIKTIF : feeds
  OBAT ||--o{ LPLPO_PREDIKTIF : requested
  OBAT ||--o{ LOG_REKONSILIASI : evaluated
  ALLOCATION_PLAN ||--o{ ALLOCATION_PLAN_ITEM : contains
  OBAT ||--o{ ALLOCATION_PLAN_ITEM : allocates
  DISTRIBUTION_RECOMMENDATION ||--o{ DISTRIBUTION_RECOMMENDATION_ITEM : contains
  DISTRIBUTION_RECOMMENDATION ||--o{ SHIPMENT_TRACKING_EVENT : tracks
```

### Prisma Schema Overview

```mermaid
classDiagram
  class Puskesmas {
    String id
    String nama
    String kecamatan
    PuskesmasType tipe
    Boolean coldChainReady
    Int skorAksesibilitas
    RainyAccess rainyAccess
  }
  class Obat {
    String id
    String nama
    MedicineCategory kategori
    MedicineType tipe
    Boolean perluColdChain
    String satuan
  }
  class Kondisi {
    String id
    String nama
    String deskripsi
  }
  class Gejala {
    String id
    String nama
    String deskripsi
  }
  class DiagnosisPeriode {
    Int id
    String puskesmasId
    String kondisiId
    DateTime periode
    Int jumlahKasus
  }
  class GejalaPeriode {
    Int id
    String puskesmasId
    String gejalaId
    DateTime periode
    Int jumlah
  }
  class AnamnesisRaw {
    Int id
    String puskesmasId
    DateTime periode
    String transkrip
    Json gejalaExtracted
  }
  class KonteksPeriode {
    Int id
    String puskesmasId
    DateTime periode
    Season season
    Int accessScore
    Boolean routeDisrupted
  }
  class StokPuskesmas {
    Int id
    String puskesmasId
    String obatId
    DateTime periode
    Int stokSaatIni
    Int konsumsiPeriode
  }
  class ForecastRun {
    Int id
    String puskesmasId
    DateTime periode
    ForecastStatus status
    Confidence confidence
  }
  class PrediksiStok {
    Int id
    Int forecastRunId
    String obatId
    Int kebutuhanObat
    Int totalRekomendasi
    Int stokSaatIni
  }
  class LplpoPrediktif {
    Int id
    Int prediksiStokId
    String puskesmasId
    String obatId
    Int jumlahDiminta
    Float daysOfStock
  }
  class AllocationPlan {
    Int id
    String puskesmasId
    DateTime periode
    AllocationStatus status
  }
  class AllocationPlanItem {
    Int id
    Int allocationPlanId
    String obatId
    Int jumlah
  }
  class Alert {
    Int id
    String puskesmasId
    AlertType type
    AlertSeverity severity
    Boolean resolved
  }
  class User {
    String id
    String username
    UserRole role
    Boolean active
  }
  class AiWorkflowJob {
    String id
    AiWorkflowKind kind
    AiWorkflowStatus status
    String puskesmasId
    DateTime periode
  }
  class Patient {
    String id
    String nik
    String fullName
    DateTime? dateOfBirth
  }
  class Pregnancy {
    String id
    String patientId
    Int? gestationalAge
    PregnancyRiskLevel riskLevel
  }
  class PatientQueue {
    String id
    String patientId
    QueueStatus status
    DateTime queuedAt
  }
  class Examination {
    String id
    String patientId
    ExaminationSource source
    Json? diagnosis
    Json? symptoms
    Json? medication
  }
  class DistributionRecommendation {
    String id
    RecommendationStatus status
    RecommendationSource source
    RecommendationUrgency urgency
  }
  class DistributionRecommendationItem {
    String id
    String recommendationId
    String obatId
    Int aiQuantity
    Int finalQuantity
  }
  class ShipmentTrackingEvent {
    String id
    String recommendationId
    TrackingStatus status
  }

  Puskesmas "1" --> "many" DiagnosisPeriode
  Puskesmas "1" --> "many" GejalaPeriode
  Puskesmas "1" --> "many" AnamnesisRaw
  Puskesmas "1" --> "many" KonteksPeriode
  Puskesmas "1" --> "many" StokPuskesmas
  Puskesmas "1" --> "many" ForecastRun
  Puskesmas "1" --> "many" LplpoPrediktif
  Puskesmas "1" --> "many" AllocationPlan
  Puskesmas "1" --> "many" Alert
  Puskesmas "1" --> "many" User
  Puskesmas "1" --> "many" Patient
  Patient "1" --> "many" Pregnancy
  Patient "1" --> "many" PatientQueue
  Patient "1" --> "many" Examination
  Obat "1" --> "many" StokPuskesmas
  ForecastRun "1" --> "many" PrediksiStok
  PrediksiStok "1" --> "1" LplpoPrediktif
  AllocationPlan "1" --> "many" AllocationPlanItem
  DistributionRecommendation "1" --> "many" DistributionRecommendationItem
  DistributionRecommendation "1" --> "many" ShipmentTrackingEvent
```

## Demo Flow

Recommended demo order:

1. Login as `admin/password123` and verify users, health centers, medicine, and facility profiles under `/admin`.
2. Logout, then login as `bidan/password123`.
3. Open `/patients/new/manual`.
4. Register patient and confirm patient enters `/queue`.
5. Call patient, open `/queue/examination`, and save examination.
6. Open `/forecast-calendar` and run the AI workflow.
7. Open `/medicine-needs` and verify LPLPO rows.
8. Logout or open a fresh session, then login as `ifk/password123`.
9. Open `/ifk/recommendations`.
10. Drag a recommendation row or use move buttons; order persists through the API.
11. Edit quantity with reason, then approve, reject, or request revision.
12. Add tracking events and open `/ifk/decision-history` to inspect final decisions.

## Testing

Run API e2e tests:

```bash
pnpm run test:e2e
```

The e2e suite expects the database to be reachable and seeded with demo data.

Build both apps:

```bash
pnpm run build
```

## Troubleshooting

### API cannot connect to PostgreSQL

Check that PostgreSQL is running on port `55432`:

```bash
docker compose ps postgres
```

If the database is fresh, run migrations and seed again:

```bash
pnpm run prisma:migrate -- --name init_normalized_schema
pnpm run prisma:seed
```

### Web cannot reach API

Make sure `apps/web/.env` points to API port `3001`:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

Then restart `pnpm run dev:web`.

### Need clean local Docker state

```bash
docker compose down -v
docker compose up --build
```
