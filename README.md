# MaternaLink API

Backend-only MaternaLink prototype with NestJS, Prisma, PostgreSQL, Swagger, Jest, and Supertest.

## Setup

```powershell
pnpm install
copy .env.example .env
docker compose up -d postgres
pnpm run prisma:generate
pnpm run prisma:migrate -- --name init_normalized_schema
pnpm run prisma:seed
pnpm run start:dev
```

Swagger runs at `http://localhost:3000/api/docs`.

The compose file maps PostgreSQL to host port `55432` because many Windows machines already run local PostgreSQL on `5432`. Container credentials remain `maternalink` / `maternalink`, database `maternalink`.

## Scripts

```powershell
pnpm run build
pnpm run test:e2e
pnpm run prisma:generate
pnpm run prisma:migrate -- --name init_normalized_schema
pnpm run prisma:seed
```

## Core Endpoints

```text
GET/POST /api/master/puskesmas
GET/POST /api/master/obat
GET      /api/master/kondisi
GET      /api/master/gejala
POST     /api/inputs/diagnosis
POST     /api/inputs/gejala
POST     /api/inputs/konteks
POST     /api/inputs/stok
POST     /api/inputs/anamnesis
POST     /api/forecast/run
GET      /api/forecast/runs
GET      /api/forecast/runs/:id/results
POST     /api/lplpo/generate
GET      /api/lplpo?puskesmasId=PKM-001&periode=2025-04-01
GET      /api/distribution/alerts
POST     /api/distribution/plans
GET      /api/distribution/plans/:id
POST     /api/distribution/plans/:id/simulate
```

## Forecast Rule

`kebutuhanObat=max(30,konsumsiPeriode)`. Buffer is `30%` when `accessScore` is `1`, otherwise `20%`. LPLPO uses `jumlahDiminta=max(0,totalRekomendasi-stokSaatIni)` and `daysOfStock=stokSaatIni/(konsumsiPeriode/30)` when consumption exists.
