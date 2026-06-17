<div align="center">

# MaternaLink

Full-stack maternal health supply-chain planning app for puskesmas medicine needs, forecast runs, LPLPO planning, and distribution risk simulation.

![NestJS](https://img.shields.io/badge/NestJS-10.4-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

## Overview

MaternaLink models a puskesmas medicine planning workflow from master data to prediction and delivery decisions. The repository contains:

- NestJS REST API with Prisma and PostgreSQL.
- Next.js dashboard for bidan and IFK workflows.
- Docker Compose stack for local API, web, and database.
- Demo seed data and e2e tests for presentation-ready flows.

Default local URLs:

| Service | URL |
|---|---|
| Web dashboard | `http://localhost:3000` |
| API base | `http://localhost:3001/api` |
| Swagger docs | `http://localhost:3001/api/docs` |
| Hosted AI API | `https://azrilfahmiardi-maternalink-ai.hf.space` |
| PostgreSQL | `localhost:55432` |

## Demo Login

Seeded users all use password `password123`.

| Username | Role | Landing route |
|---|---|---|
| `bidan` | `BIDAN_PUSKESMAS` | `/dashboard` |
| `ifk` | `IFK_ADMIN` | `/ifk` |

## Features

- Puskesmas, medicine, clinical condition, and symptom master data.
- Monthly diagnosis, symptom, context, stock, and anamnesis inputs.
- Deterministic demand forecast per puskesmas and period.
- Predictive LPLPO generation from forecast output.
- Allocation plan simulation with route disruption and cold-chain alerts.
- Responsive dashboard pages for overview, patients/master data, forecast calendar, medicine needs, and IFK flows.

## Tech Stack

| Area | Stack |
|---|---|
| Monorepo | pnpm workspace |
| API | NestJS 10, TypeScript, Swagger |
| Database | PostgreSQL 16, Prisma 5 |
| Web | Next.js 15, React 18, Ant Design 5, Leaflet |
| Test | Jest, Supertest |
| Local runtime | Docker Compose |

## Repository Structure

```text
.
+-- apps
|   +-- api          # NestJS API, Prisma schema, migrations, seed, e2e test
|   +-- web          # Next.js dashboard and UI assets
+-- docker-compose.yml
+-- Dockerfile       # API Docker build
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
4. Prisma migrations through API entrypoint.
5. Demo seed data when `RUN_SEED=true`.

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
| `PORT` | No | `3001` | NestJS HTTP port. |
| `RUN_SEED` | No | `true` | Docker entrypoint runs seed data when set to `true`. |
| `WEB_ORIGIN` | No | `http://localhost:3000` | CORS origin allowed to send credentialed auth requests. |
| `AI_MODE` | No | `remote` | `remote` calls the hosted Hugging Face AI API; `fallback` skips external calls for offline development. |
| `AI_SERVICE_BASE_URL` | No | `https://azrilfahmiardi-maternalink-ai.hf.space` | Hosted MaternaLink AI base URL. |
| `AI_SERVICE_TIMEOUT_MS` | No | `30000` | Timeout for health, Layer 0, and Layer 1 AI calls. |
| `AI_LAYER2_TIMEOUT_MS` | No | `600000` | Timeout for long Layer 2 allocation calls. |

### Web

File: `apps/web/.env`

| Variable | Required | Default/example | Description |
|---|:---:|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | No | `http://localhost:3001/api` | API base URL used by the dashboard. |

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
| `/dashboard` | Main dashboard overview. |
| `/patients` | Patient list. |
| `/patients/new` | Add patient method selection. |
| `/patients/new/manual` | Manual patient registration. |
| `/patients/new/kia-upload` | KIA upload extraction flow. |
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

Role entry routes are `/dashboard` for bidan and `/ifk` for IFK.

## Hosted AI Integration

The backend calls the hosted MaternaLink AI API directly. The frontend never calls Hugging Face directly.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service status. |
| `POST` | `/api/v1/layer0/extract` | Symptom extraction and condition estimates. |
| `POST` | `/api/v1/layer1/forecast` | Drug demand forecast per facility and medicine. |
| `POST` | `/api/v1/layer2/allocate` | Equitable allocation and justifications. |

Layer 2 may take several minutes, so `/api/workflow/demo/run` starts an async backend job and `/api/workflow/demo/state` is used for polling.

## API Modules

All endpoints use the `/api` global prefix.

### Master

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/master/puskesmas` | List puskesmas master data. |
| `POST` | `/api/master/puskesmas` | Create puskesmas master data. |
| `GET` | `/api/master/obat` | List medicine master data. |
| `POST` | `/api/master/obat` | Create medicine master data. |
| `GET` | `/api/master/kondisi` | List clinical conditions. |
| `GET` | `/api/master/gejala` | List maternal symptoms. |

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
| `GET` | `/api/forecast/runs` | List forecast runs. |
| `GET` | `/api/forecast/runs/:id/results` | Get forecast result rows. |
| `POST` | `/api/lplpo/generate` | Generate predictive LPLPO rows from latest forecast. |
| `GET` | `/api/lplpo` | List LPLPO rows, optionally filtered by `puskesmasId` and `periode`. |
| `GET` | `/api/distribution/alerts` | List distribution alerts. |
| `POST` | `/api/distribution/plans` | Create allocation plan. |
| `GET` | `/api/distribution/plans/:id` | Get allocation plan. |
| `POST` | `/api/distribution/plans/:id/simulate` | Simulate route and cold-chain risk. |

## Architecture

### Backend Flow

```mermaid
flowchart LR
  A["Master puskesmas, medicine, condition, symptom data"] --> B["Monthly clinical, context, and stock inputs"]
  B --> C["Deterministic forecast"]
  C --> D["Medicine demand prediction"]
  D --> E["Predictive LPLPO"]
  E --> F["Allocation plan"]
  F --> G["Distribution simulation"]
  G --> H["Route and cold-chain alerts"]
```

### API Runtime

```mermaid
flowchart LR
  A["Client / Swagger"] -->|"/api/*"| B["NestJS Controller"]
  B --> C["Service layer"]
  C --> D["Prisma Client"]
  D --> E[("PostgreSQL")]
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

  Puskesmas "1" --> "many" DiagnosisPeriode
  Puskesmas "1" --> "many" GejalaPeriode
  Puskesmas "1" --> "many" AnamnesisRaw
  Puskesmas "1" --> "many" KonteksPeriode
  Puskesmas "1" --> "many" StokPuskesmas
  Puskesmas "1" --> "many" ForecastRun
  Puskesmas "1" --> "many" LplpoPrediktif
  Puskesmas "1" --> "many" AllocationPlan
  Puskesmas "1" --> "many" Alert
  Obat "1" --> "many" StokPuskesmas
  ForecastRun "1" --> "many" PrediksiStok
  PrediksiStok "1" --> "1" LplpoPrediktif
  AllocationPlan "1" --> "many" AllocationPlanItem
```

## Demo Flow

Recommended demo order:

1. Login as `bidan/password123`.
2. Open `/patients/new/manual` or `/patients/new/kia-upload`.
3. Register patient and confirm patient enters `/queue`.
4. Call patient, open `/queue/examination`, and save examination.
5. Open `/forecast-calendar` and run workflow.
6. Open `/medicine-needs` and verify LPLPO rows.
7. Logout or open a fresh session, then login as `ifk/password123`.
8. Open `/ifk/recommendations`.
9. Drag a recommendation row or use move buttons; order persists through the API.
10. Edit quantity with reason, then approve or reject.
11. Open `/ifk/decision-history` to inspect final decisions.

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
