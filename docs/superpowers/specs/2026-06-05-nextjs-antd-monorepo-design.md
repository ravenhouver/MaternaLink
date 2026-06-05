# Next.js Ant Design Monorepo Setup Design

Date: 2026-06-05
Project: MaternaLink / Furap-Jogja

## Goal

Set up a frontend workspace in this repository using Next.js, TypeScript, and Ant Design. Convert the existing repository into a lightweight pnpm monorepo with one API app and one web app.

This work is setup-focused. It must not implement new backend features, change API behavior, change Prisma models, or add new backend endpoints.

## Current Context

The repository currently contains a NestJS 10 API with Prisma and PostgreSQL at the repository root. The API uses the global `/api` prefix and exposes Swagger at `/api/docs`. Existing backend modules are:

- Master data
- Monthly inputs
- Forecast
- LPLPO
- Distribution

The repository already uses pnpm and has existing Docker, Prisma, seed, build, and e2e workflows.

## Selected Approach

Use manual `pnpm workspaces`.

Target structure:

```text
D:\Furap-Jogja\
  apps\
    api\
      # Existing NestJS backend, moved without behavior changes
    web\
      # New Next.js App Router frontend
  docs\
  pnpm-workspace.yaml
  package.json
```

Rationale:

- It matches the existing pnpm-based project.
- It keeps monorepo setup lightweight.
- It avoids Turborepo or Nx overhead while there are only two apps.
- It creates clean app boundaries for future shared packages if needed.

## Backend Boundary

The existing backend should move from the repository root into `apps/api`.

Allowed backend changes:

- File path relocation.
- Script path updates.
- Docker path updates required for the relocated app.
- README or env example updates that explain the new commands.

Not allowed in this setup scope:

- New backend feature implementation.
- New endpoints.
- Prisma schema changes.
- Controller, service, DTO, or forecast logic changes beyond path/import fixes required by relocation.

## Root Workspace

Root `package.json` should act as a workspace coordinator. It should expose scripts similar to:

```text
dev
dev:api
dev:web
build
build:api
build:web
test:e2e
prisma:generate
prisma:migrate
prisma:deploy
prisma:seed
```

Backend-specific scripts should call the API workspace. Frontend-specific scripts should call the web workspace.

The root should not keep app runtime dependencies that belong to `apps/api` or `apps/web`.

## Frontend App

Create `apps/web` using:

- Next.js App Router
- TypeScript
- Ant Design
- ESLint defaults suitable for Next.js

The first screen should be the dashboard experience, not a marketing landing page.

Initial routes:

```text
/
/master
/inputs
/forecast
/lplpo
/distribution
```

The routes should align with the existing backend workflow:

```text
Master Data -> Inputs -> Forecast -> LPLPO -> Distribution
```

## Dashboard Shell

The dashboard shell should use Ant Design components:

- `Layout` for page frame.
- `Sider` and `Menu` for navigation.
- `Header` for app title or current section context.
- `Card`, `Statistic`, `Alert`, and placeholder `Table` components for initial content.

The shell should include simple, practical placeholders. It should not pretend unavailable workflows are complete.

The home dashboard should show:

- API reachability state.
- Summary cards for main modules.
- Shortcuts into each setup route.

## API Configuration

The web app should read API base URL from:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

This value should live in `apps/web/.env.example`.

The frontend can check API reachability using an existing endpoint such as:

```text
GET /master/puskesmas
```

If the API is unavailable, the dashboard should show an Ant Design error or warning state instead of crashing.

## Ports

Use separate development ports:

- API: `3000`
- Web: `3001`

This avoids conflict with the existing NestJS API port.

## Docker

Existing Docker support should continue to run the backend API and PostgreSQL. Because the backend moves to `apps/api`, Dockerfile and compose paths need to be updated.

This setup does not require containerizing the web app unless needed later.

## Validation

Implementation should be considered valid when these commands pass:

```text
pnpm install
pnpm --filter @maternalink/api build
pnpm --filter @maternalink/web build
```

If the local database is available, backend validation can also include:

```text
pnpm --filter @maternalink/api test:e2e
```

## Out of Scope

- Authentication.
- Role-based access.
- Full CRUD screens.
- Backend feature work.
- Generated API client.
- Shared package extraction.
- Production frontend deployment.
- Web app Docker image.

## Open Decisions

No open decisions remain for this setup phase.
