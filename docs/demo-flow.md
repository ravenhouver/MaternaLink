# MaternaLink Demo Flow

This demo proves DB setup, API setup, ERD intent, and Swagger readiness for the MaternaLink Problem Research MVP.

## 1. Prepare Database

```powershell
pnpm install
copy .env.example .env
docker compose up -d postgres
pnpm run prisma:generate
pnpm run prisma:migrate -- --name problem_research_alignment
pnpm run prisma:seed
pnpm run start:dev
```

Open Swagger: `http://localhost:3000/api/docs`.

## 2. Check Master Data

```powershell
Invoke-RestMethod http://localhost:3000/api/master/puskesmas
Invoke-RestMethod http://localhost:3000/api/master/obat
Invoke-RestMethod http://localhost:3000/api/master/kondisi
Invoke-RestMethod http://localhost:3000/api/master/gejala
```

Expected story: `PKM-REMOTE-001` represents a remote maternal healthcare facility with rainy-season access risk and no cold-chain readiness.

## 3. Add Monthly Context

```powershell
Invoke-RestMethod -Method Post http://localhost:3000/api/inputs/konteks -ContentType 'application/json' -Body '{"puskesmasId":"PKM-REMOTE-001","periode":"2025-04-01","season":"HUJAN","accessScore":1,"rainyAccess":"TERGANGGU","routeDisrupted":true,"jumlahBumilT1":10,"jumlahBumilT2":15,"jumlahBumilT3":12,"statusKlb":false,"riwayatStockout6Bln":{"OBT-010":2}}'
```

## 4. Run Forecast

```powershell
Invoke-RestMethod -Method Post http://localhost:3000/api/forecast/run -ContentType 'application/json' -Body '{"puskesmasId":"PKM-REMOTE-001","periode":"2025-04-01"}'
Invoke-RestMethod http://localhost:3000/api/forecast/runs
```

Expected story: forecast produces deterministic stock recommendation rows for demo reliability.

## 5. Generate LPLPO

```powershell
Invoke-RestMethod -Method Post http://localhost:3000/api/lplpo/generate -ContentType 'application/json' -Body '{"puskesmasId":"PKM-REMOTE-001","periode":"2025-04-01"}'
Invoke-RestMethod 'http://localhost:3000/api/lplpo?puskesmasId=PKM-REMOTE-001&periode=2025-04-01'
```

## 6. Simulate Distribution Risk

```powershell
$plan = Invoke-RestMethod -Method Post http://localhost:3000/api/distribution/plans -ContentType 'application/json' -Body '{"puskesmasId":"PKM-REMOTE-001","periode":"2025-04-01","items":[{"obatId":"OBT-010","jumlah":12,"note":"Emergency preeclampsia stock"}]}'
Invoke-RestMethod -Method Post "http://localhost:3000/api/distribution/plans/$($plan.id)/simulate"
Invoke-RestMethod http://localhost:3000/api/distribution/alerts
```

Expected story: simulation creates route disruption and cold-chain mismatch alerts.
