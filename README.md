<div align="center">

# MaternaLink

### Backend MVP for Maternal Health Supply-Chain Planning

REST API backend for modeling puskesmas data, maternal clinical signals, medicine stock, demand forecasting, predictive LPLPO requests, and distribution risk alerts. The application is built with **NestJS**, **TypeScript**, **Prisma**, and **PostgreSQL**.

<br />

<img src="https://img.shields.io/badge/NestJS-10.4-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
<img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
<img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />

<br />

<img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/pnpm-ready-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm" />
<img src="https://img.shields.io/badge/Jest-E2E-C21325?style=flat-square&logo=jest&logoColor=white" alt="Jest" />
<img src="https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?style=flat-square&logo=swagger&logoColor=111111" alt="Swagger" />
<img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker Compose" />
<img src="https://img.shields.io/badge/E2E-6%20passing-brightgreen?style=flat-square" alt="E2E" />

<br />
<br />

<a href="#overview"><strong>Overview</strong></a> .
<a href="#features"><strong>Features</strong></a> .
<a href="#tech-stack"><strong>Tech Stack</strong></a> .
<a href="#quick-start"><strong>Quick Start</strong></a> .
<a href="#architecture"><strong>Architecture</strong></a> .
<a href="#api-modules"><strong>API Modules</strong></a> .
<a href="#troubleshooting"><strong>Troubleshooting</strong></a>

</div>

---

## Overview

**MaternaLink API** is a backend MVP for maternal health supply-chain planning. It connects puskesmas master data, medicine master data, clinical conditions, symptoms, stock inputs, access context, deterministic forecasts, predictive LPLPO rows, and distribution simulations.

The project is designed for database setup, API setup, ERD documentation, Swagger documentation, and a repeatable demo workflow.

Local API URL:

```text
http://localhost:3000/api
```

Swagger UI:

```text
http://localhost:3000/api/docs
```

---

## Features

<table>
  <tr>
    <td width="50%">
      <h3>Clinical Data and Inputs</h3>
      <ul>
        <li>Puskesmas master data with location and logistics metadata.</li>
        <li>Medicine, maternal condition, and symptom master data.</li>
        <li>Monthly diagnosis inputs per puskesmas.</li>
        <li>Monthly symptom inputs per puskesmas.</li>
        <li>Raw anamnesis records for clinical data traceability.</li>
        <li>Access, season, pregnancy, and stockout context inputs.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>Forecast and Distribution</h3>
      <ul>
        <li>Deterministic stock forecasting for backend validation.</li>
        <li>Medicine demand prediction rows per period.</li>
        <li>Predictive LPLPO generation from forecast results.</li>
        <li>Allocation plan simulation for puskesmas facilities.</li>
        <li>Route disruption and cold-chain mismatch alerts.</li>
        <li>Ready-to-run demo flow for presentation.</li>
      </ul>
    </td>
  </tr>
</table>

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | **Node.js**, **TypeScript `5.7`** |
| Framework | **NestJS `10.4`** |
| Database | **PostgreSQL `16`** |
| ORM | **Prisma `5.22`** |
| API Docs | **Swagger / OpenAPI** |
| Validation | **class-validator**, **class-transformer** |
| Testing | **Jest**, **Supertest** |
| Local Infra | **Docker Compose** for API and PostgreSQL |
| Package Manager | **pnpm** |

---

## Quick Start

### 1. Clone repository

```bash
git clone https://github.com/0xSyam/MaternaLink
cd MaternaLink
```

### 2. Run full Docker stack

```bash
docker compose up --build
```

Compose will run:

1. PostgreSQL `16`.
2. The `maternalink-api` image build.
3. Prisma Client generation during the image build.
4. `prisma migrate deploy` when the API container starts.
5. Demo seed data when `RUN_SEED=true`.
6. The NestJS API on port `3000`.

Open Swagger UI:

```text
http://localhost:3000/api/docs
```

### 3. Optional local development

Use these commands if you want to run the API directly on the host machine during development.

```bash
pnpm install
copy .env.example .env
docker compose up -d postgres
pnpm run prisma:generate
pnpm run prisma:migrate -- --name init_normalized_schema
pnpm run prisma:seed
pnpm run start:dev
```

---

## Environment Variables

| Variable | Required | Example | Description |
|---|:---:|---|---|
| `DATABASE_URL` | Yes | `postgresql://maternalink:maternalink@localhost:55432/maternalink?schema=public` | PostgreSQL connection string used by Prisma. |
| `PORT` | No | `3000` | NestJS HTTP port. The application defaults to `3000` when this is not set. |
| `RUN_SEED` | No | `true` | When set to `true`, the API entrypoint runs demo seed data after migrations. |

### Environment Rules

- Do not commit `.env` files containing real production values.
- Use `.env.example` only for local placeholder configuration.
- Do not store production passwords, tokens, secret keys, private keys, or credentials in the repository.
- Update `DATABASE_URL` if your local PostgreSQL port differs from the default setup.

---

## Docker Local Usage

This project can run fully through Docker Compose. The `api` service builds the NestJS image, waits for PostgreSQL to become healthy, runs `prisma migrate deploy`, runs demo seed data when `RUN_SEED=true`, and then starts the production API.

### Start full stack

```bash
docker compose up --build
```

Local API URL:

```text
http://localhost:3000/api
```

Swagger UI:

```text
http://localhost:3000/api/docs
```

### Run in background

```bash
docker compose up -d --build
```

### Check service status

```bash
docker compose ps
```

Expected services:

```text
api        Up   0.0.0.0:3000->3000/tcp
postgres   Up   0.0.0.0:55432->5432/tcp
```

### View logs

```bash
docker compose logs -f api
docker compose logs -f postgres
```

### Stop stack

```bash
docker compose down
```

### Reset database volume

Use this only when you want to remove local database data and recreate it from migrations and seed data.

```bash
docker compose down -v
docker compose up --build
```

### Database URLs

The API container uses the internal Compose network:

```text
postgresql://maternalink:maternalink@postgres:5432/maternalink?schema=public
```

Tools running from the Windows host can use port `55432`:

```text
postgresql://maternalink:maternalink@localhost:55432/maternalink?schema=public
```

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm run start:dev` | Run NestJS development mode with watch. |
| `pnpm run start` | Run the compiled app from `dist/src/main.js`. |
| `pnpm run build` | Build the NestJS application. |
| `pnpm run test:e2e` | Run Jest + Supertest end-to-end tests. |
| `pnpm run prisma:generate` | Generate Prisma Client. |
| `pnpm run prisma:migrate` | Run Prisma development migrations. |
| `pnpm run prisma:deploy` | Run Prisma production migrations for containers or deploys. |
| `pnpm run prisma:seed` | Insert demo seed data. |
| `docker compose up --build` | Build and run the API + PostgreSQL stack. |

Recommended validation before merge:

```bash
pnpm run prisma:generate
pnpm prisma migrate status
pnpm run prisma:seed
pnpm run build
pnpm run test:e2e
```

---

## Project Structure

```text
prisma/
  schema.prisma                    # Database schema
  seed.ts                          # Demo seed data
Dockerfile                         # Production image for the NestJS API
docker-compose.yml                 # Full local stack: API + PostgreSQL
docker-entrypoint.sh               # Wait for DB, deploy migrations, seed, start API
src/
  main.ts                          # Nest bootstrap, global prefix, Swagger setup
  app.module.ts                    # Root application module
  prisma/                          # Prisma module and service
  modules/
    master/                        # Master data API
    inputs/                        # Monthly input API
    forecast/                      # Forecast API
    lplpo/                         # Predictive LPLPO API
    distribution/                  # Allocation and alert API
docs/
  api/openapi-notes.md             # OpenAPI notes
  erd/maternalink-erd.mmd          # Mermaid ERD
  demo-flow.md                     # Presentation demo script
test/
  app.e2e-spec.ts                  # End-to-end API tests
```

---

## API Modules

### Master Data

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/master/puskesmas` | List puskesmas reference data. |
| `POST` | `/api/master/puskesmas` | Create puskesmas reference data. |
| `GET` | `/api/master/obat` | List medicine reference data. |
| `POST` | `/api/master/obat` | Create medicine reference data. |
| `GET` | `/api/master/kondisi` | List maternal condition master data. |
| `GET` | `/api/master/gejala` | List symptom master data. |

### Monthly Inputs

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/inputs/diagnosis` | Save monthly diagnosis input. |
| `POST` | `/api/inputs/gejala` | Save monthly symptom input. |
| `POST` | `/api/inputs/konteks` | Save context, access, pregnancy, and stockout signals. |
| `POST` | `/api/inputs/stok` | Save medicine stock and consumption input. |
| `POST` | `/api/inputs/anamnesis` | Save raw anamnesis transcript data. |

### Forecast, LPLPO, Distribution

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/forecast/run` | Run deterministic stock forecast. |
| `GET` | `/api/forecast/runs` | List forecast runs. |
| `GET` | `/api/forecast/runs/:id/results` | Inspect forecast results. |
| `POST` | `/api/lplpo/generate` | Generate predictive LPLPO request rows. |
| `GET` | `/api/lplpo` | Filter generated LPLPO rows. |
| `GET` | `/api/distribution/alerts` | List route and cold-chain alerts. |
| `POST` | `/api/distribution/plans` | Create allocation plan. |
| `GET` | `/api/distribution/plans/:id` | Inspect allocation plan. |
| `POST` | `/api/distribution/plans/:id/simulate` | Simulate allocation risk. |

---

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



---

## Demo Flow


Recommended demo order:

1. Open Swagger UI.
2. Inspect puskesmas and medicine master data.
3. Submit puskesmas monthly context.
4. Run forecast.
5. Generate LPLPO.
6. Create an allocation plan.
7. Simulate distribution risk.
8. Inspect generated alerts.

---

## Testing

| Test Command | Description |
|---|---|
| `pnpm run test:e2e` | Run all end-to-end API tests. |
| `pnpm run build` | Verify TypeScript and NestJS build output. |
| `pnpm prisma migrate status` | Check database migration status. |

Full backend check:

```bash
pnpm run prisma:generate
pnpm prisma migrate status
pnpm run prisma:seed
pnpm run build
pnpm run test:e2e
```

Latest verified state:

| Check | Status |
|---|---|
| Prisma generate | Passing |
| Prisma migrations | Up to date |
| Seed | Passing |
| Build | Passing |
| E2E tests | 6 passing |
| Swagger UI | Available at `/api/docs` |

---

## Troubleshooting

### Prisma cannot connect to the database

Possible causes:

- PostgreSQL container is not running.
- Port `55432` is already used by another service.
- `DATABASE_URL` does not match `docker-compose.yml`.

Check with:

```bash
docker compose ps
docker compose logs postgres
pnpm prisma migrate status
```

### Migration fails because the database contains old local data

Reset the volume only when local database data can be removed.

```bash
docker compose down -v
docker compose up --build
```

### Swagger does not open

Make sure the API is running and the port is correct.

```bash
docker compose ps
docker compose logs -f api
```

Swagger URL:

```text
http://localhost:3000/api/docs
```

If you run the API on another port, update `PORT` accordingly.

### Endpoint returns a validation error

The global validation pipe uses whitelist mode and rejects fields that are not defined in the DTO. Make sure request bodies only contain fields supported by the target endpoint.


---

## Code Conventions

- Use TypeScript for all application source files.
- Place new API features under `src/modules/<feature>`.
- Keep controller, DTO, service, and module files aligned with the existing NestJS pattern.
- Access Prisma Client through `PrismaService` from `src/prisma`.
- Validate inputs through DTOs and `class-validator` decorators.
- Do not bypass the global `/api` prefix when adding endpoints.
- Update Swagger decorators when endpoint contracts change.
- Add or update E2E tests for important workflow changes.

---

## Pull Request Checklist

Before merging, verify:

- [ ] `pnpm run prisma:generate` passes.
- [ ] `pnpm prisma migrate status` has been checked.
- [ ] `pnpm run prisma:seed` works on a clean local database.
- [ ] `pnpm run build` passes.
- [ ] `pnpm run test:e2e` passes or relevant tests have been run.
- [ ] No secret, credential, or production `.env` file is committed.
- [ ] Prisma schema changes include the required migration.
- [ ] Endpoint changes are reflected in Swagger and related documentation.

---

<div align="center">

**MaternaLink API**

Backend MVP for maternal health supply-chain planning.

Built with NestJS, Prisma, and PostgreSQL.

</div>

