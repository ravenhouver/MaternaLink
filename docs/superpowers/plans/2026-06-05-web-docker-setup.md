# Web Docker Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the existing Next.js web workspace to Docker Compose as a production container on port `3001`.

**Architecture:** Keep the existing API Dockerfile unchanged. Add a dedicated `apps/web/Dockerfile` that builds and runs `@maternalink/web`, then add a `web` service to `docker-compose.yml` that depends on `api` and exposes `3001`.

**Tech Stack:** Docker Compose, Node 22 Alpine, pnpm workspaces, Next.js, Ant Design.

---

## Scope Check

This is one focused Docker setup task. It does not change backend logic, Prisma schema, API routes, or frontend feature behavior.

## File Structure

- Create: `D:\Furap-Jogja\apps\web\Dockerfile`
- Modify: `D:\Furap-Jogja\docker-compose.yml`
- Modify: `D:\Furap-Jogja\README.md`

### Task 1: Add Web Dockerfile

**Files:**
- Create: `D:\Furap-Jogja\apps\web\Dockerfile`

- [ ] **Step 1: Create production Dockerfile**

Create `apps/web/Dockerfile`:

```dockerfile
FROM node:22-alpine AS deps

WORKDIR /app

ARG PNPM_VERSION=10.11.0
RUN npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile --filter @maternalink/web...

FROM deps AS build

COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN pnpm run build

FROM node:22-alpine AS runner

WORKDIR /app

ARG PNPM_VERSION=10.11.0
ENV NODE_ENV=production
ENV PORT=3001

RUN npm install -g pnpm@${PNPM_VERSION}

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/web/next.config.ts ./apps/web/next.config.ts

EXPOSE 3001

CMD ["pnpm", "--filter", "@maternalink/web", "start"]
```

- [ ] **Step 2: Verify local web build still passes**

Run:

```powershell
pnpm --filter @maternalink/web build
```

Expected: Next.js production build exits `0`.

### Task 2: Add Compose Web Service

**Files:**
- Modify: `D:\Furap-Jogja\docker-compose.yml`

- [ ] **Step 1: Add web service**

Modify `docker-compose.yml` so it contains a `web` service:

```yaml
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_BASE_URL: http://localhost:3000/api
    ports:
      - "3001:3001"
    depends_on:
      - api
    restart: unless-stopped
```

- [ ] **Step 2: Verify compose config**

Run:

```powershell
docker compose config
```

Expected: compose config exits `0` and shows services `api`, `web`, and `postgres`.

### Task 3: Update README Docker Usage

**Files:**
- Modify: `D:\Furap-Jogja\README.md`

- [ ] **Step 1: Update Docker service description**

Update Docker and quick-start text so `docker compose up --build` says it runs PostgreSQL, API, and web dashboard.

- [ ] **Step 2: Add web URL to Docker section**

Ensure README includes:

```text
Web dashboard:
http://localhost:3001
```

### Task 4: Final Verification

**Files:**
- Verify source only.

- [ ] **Step 1: Run web build**

Run:

```powershell
pnpm --filter @maternalink/web build
```

Expected: exit `0`.

- [ ] **Step 2: Run compose config**

Run:

```powershell
docker compose config
```

Expected: exit `0`.

- [ ] **Step 3: Build web image if Docker daemon is available**

Run:

```powershell
docker compose build web
```

Expected when Docker Desktop is running: image builds successfully. If Docker daemon is unavailable, record the daemon error and do not treat it as a source failure.

- [ ] **Step 4: Commit**

Run:

```powershell
git add apps/web/Dockerfile docker-compose.yml README.md
git commit -m "chore: add web docker service"
```

Expected: commit succeeds.

## Self-Review

- Spec coverage: plan covers web Dockerfile, Compose `web` service, browser-facing API base URL, README update, local build, Compose config, and optional Docker image build.
- Empty-work marker scan: no unresolved implementation markers remain.
- Scope check: no backend source, Prisma, API contract, or frontend feature behavior changes are planned.
