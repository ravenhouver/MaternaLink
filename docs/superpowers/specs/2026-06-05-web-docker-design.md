# Web Docker Setup Design

Date: 2026-06-05
Project: MaternaLink / Furap-Jogja

## Goal

Add the existing Next.js frontend workspace to Docker Compose as a production container.

## Scope

This work only changes frontend Docker runtime setup. It must not change backend controller, service, DTO, Prisma schema, database migrations, or frontend feature behavior.

## Selected Approach

Use a production Next.js container for `apps/web`.

The Compose stack should expose:

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs`
- Web dashboard: `http://localhost:3001`

## Docker Compose

Add a `web` service to `docker-compose.yml`:

- Build context: repository root.
- Dockerfile: `apps/web/Dockerfile`.
- Port mapping: `3001:3001`.
- Dependency: `api`.
- Environment: `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api`.
- Restart policy: `unless-stopped`.

The frontend API base URL should use `localhost:3000` because the value is consumed by browser-side code. Browser users cannot resolve Docker's internal `api` hostname.

## Web Dockerfile

Create `apps/web/Dockerfile` as a multi-stage build:

1. Install pnpm and workspace dependencies for `@maternalink/web`.
2. Build the web app with `pnpm --filter @maternalink/web build`.
3. Run production web server with `pnpm --filter @maternalink/web start` on port `3001`.

The Dockerfile should copy only required monorepo manifests first for layer caching, then copy `apps/web` for build.

## Documentation

Update README Docker usage so `docker compose up --build` clearly starts API, PostgreSQL, and web dashboard.

## Validation

Required checks:

```text
pnpm --filter @maternalink/web build
docker compose config
```

If Docker daemon is running, also check:

```text
docker compose build web
```

## Out of Scope

- Dev hot-reload container.
- Nginx reverse proxy.
- Web app deployment pipeline.
- Backend feature changes.
- API route or Prisma changes.

## Open Decisions

No open decisions remain for this setup phase.
