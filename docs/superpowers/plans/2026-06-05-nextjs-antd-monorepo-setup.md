# Next.js Ant Design Monorepo Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `D:\Furap-Jogja` into a pnpm monorepo with the existing NestJS API in `apps/api` and a new Next.js App Router + Ant Design dashboard shell in `apps/web`.

**Architecture:** The root package coordinates workspace scripts only. The NestJS backend moves intact into `apps/api` with behavior unchanged. The web app in `apps/web` consumes the existing `/api` backend through `NEXT_PUBLIC_API_BASE_URL` and starts as a dashboard shell aligned to the current backend modules.

**Tech Stack:** pnpm workspaces, NestJS 10, Prisma 5, PostgreSQL, Next.js App Router, TypeScript, Ant Design, React.

---

## Scope Check

This plan covers one setup project. It includes monorepo restructuring, frontend setup, dashboard shell, Docker path updates, and validation. It excludes backend feature work, Prisma schema changes, new API endpoints, auth, generated API clients, and production web deployment.

## File Structure

### Move existing backend into `apps/api`

- Move: `D:\Furap-Jogja\src` -> `D:\Furap-Jogja\apps\api\src`
- Move: `D:\Furap-Jogja\prisma` -> `D:\Furap-Jogja\apps\api\prisma`
- Move: `D:\Furap-Jogja\test` -> `D:\Furap-Jogja\apps\api\test`
- Move: `D:\Furap-Jogja\nest-cli.json` -> `D:\Furap-Jogja\apps\api\nest-cli.json`
- Move: `D:\Furap-Jogja\tsconfig.json` -> `D:\Furap-Jogja\apps\api\tsconfig.json`
- Move: `D:\Furap-Jogja\.env.example` -> `D:\Furap-Jogja\apps\api\.env.example`
- Move: `D:\Furap-Jogja\docker-entrypoint.sh` -> `D:\Furap-Jogja\apps\api\docker-entrypoint.sh`
- Modify: `D:\Furap-Jogja\apps\api\package.json` with the old API dependencies and scripts.

### Root workspace files

- Modify: `D:\Furap-Jogja\package.json` into workspace coordinator.
- Create: `D:\Furap-Jogja\pnpm-workspace.yaml`.
- Modify: `D:\Furap-Jogja\.gitignore` only if needed for Next.js build outputs.
- Modify: `D:\Furap-Jogja\pnpm-lock.yaml` through `pnpm install`.

### Docker and docs

- Modify: `D:\Furap-Jogja\Dockerfile` for workspace-aware API image build.
- Modify: `D:\Furap-Jogja\docker-compose.yml` only where backend paths or build args require it.
- Modify: `D:\Furap-Jogja\README.md` to document monorepo commands.

### New web app

- Create: `D:\Furap-Jogja\apps\web\package.json`.
- Create: `D:\Furap-Jogja\apps\web\next.config.ts`.
- Create: `D:\Furap-Jogja\apps\web\tsconfig.json`.
- Create: `D:\Furap-Jogja\apps\web\next-env.d.ts`.
- Create: `D:\Furap-Jogja\apps\web\.env.example`.
- Create: `D:\Furap-Jogja\apps\web\src\app\layout.tsx`.
- Create: `D:\Furap-Jogja\apps\web\src\app\page.tsx`.
- Create: `D:\Furap-Jogja\apps\web\src\app\globals.css`.
- Create: `D:\Furap-Jogja\apps\web\src\app\master\page.tsx`.
- Create: `D:\Furap-Jogja\apps\web\src\app\inputs\page.tsx`.
- Create: `D:\Furap-Jogja\apps\web\src\app\forecast\page.tsx`.
- Create: `D:\Furap-Jogja\apps\web\src\app\lplpo\page.tsx`.
- Create: `D:\Furap-Jogja\apps\web\src\app\distribution\page.tsx`.
- Create: `D:\Furap-Jogja\apps\web\src\components\app-shell.tsx`.
- Create: `D:\Furap-Jogja\apps\web\src\components\module-page.tsx`.
- Create: `D:\Furap-Jogja\apps\web\src\lib\api.ts`.

---

### Task 1: Move API into workspace shape

**Files:**
- Create: `D:\Furap-Jogja\apps\api\package.json`
- Modify: `D:\Furap-Jogja\package.json`
- Create: `D:\Furap-Jogja\pnpm-workspace.yaml`
- Move existing backend files listed in File Structure.

- [ ] **Step 1: Create API directory**

Run:

```powershell
New-Item -ItemType Directory -Force -Path apps\api | Out-Null
```

Expected: `D:\Furap-Jogja\apps\api` exists.

- [ ] **Step 2: Move backend files with git tracking**

Run:

```powershell
git mv src apps\api\src
git mv prisma apps\api\prisma
git mv test apps\api\test
git mv nest-cli.json apps\api\nest-cli.json
git mv tsconfig.json apps\api\tsconfig.json
git mv .env.example apps\api\.env.example
git mv docker-entrypoint.sh apps\api\docker-entrypoint.sh
```

Expected: files move without changing backend source contents.

- [ ] **Step 3: Replace root package with workspace coordinator**

Edit `D:\Furap-Jogja\package.json` to this exact content:

```json
{
  "name": "maternalink",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel --filter @maternalink/api --filter @maternalink/web dev",
    "dev:api": "pnpm --filter @maternalink/api start:dev",
    "dev:web": "pnpm --filter @maternalink/web dev",
    "build": "pnpm --filter @maternalink/api build && pnpm --filter @maternalink/web build",
    "build:api": "pnpm --filter @maternalink/api build",
    "build:web": "pnpm --filter @maternalink/web build",
    "start:api": "pnpm --filter @maternalink/api start",
    "test:e2e": "pnpm --filter @maternalink/api test:e2e",
    "prisma:generate": "pnpm --filter @maternalink/api prisma:generate",
    "prisma:migrate": "pnpm --filter @maternalink/api prisma:migrate",
    "prisma:deploy": "pnpm --filter @maternalink/api prisma:deploy",
    "prisma:seed": "pnpm --filter @maternalink/api prisma:seed"
  }
}
```

- [ ] **Step 4: Create workspace manifest**

Create `D:\Furap-Jogja\pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
```

- [ ] **Step 5: Create API package manifest**

Create `D:\Furap-Jogja\apps\api\package.json` with the old dependency set and workspace name:

```json
{
  "name": "@maternalink/api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "node dist/src/main.js",
    "start:dev": "nest start --watch",
    "build": "nest build",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:seed": "prisma db seed"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.15",
    "@nestjs/core": "^10.4.15",
    "@nestjs/mapped-types": "^2.1.0",
    "@nestjs/platform-express": "^10.4.15",
    "@nestjs/swagger": "^8.1.1",
    "@prisma/client": "^5.22.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.8",
    "@nestjs/schematics": "^10.2.3",
    "@nestjs/testing": "^10.4.15",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.2",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "prisma": "^5.22.0",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.2"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

- [ ] **Step 6: Install workspace dependencies**

Run:

```powershell
pnpm install
```

Expected: install completes and updates `D:\Furap-Jogja\pnpm-lock.yaml` for workspace packages.

- [ ] **Step 7: Verify API build after relocation**

Run:

```powershell
pnpm --filter @maternalink/api build
```

Expected: build passes and `D:\Furap-Jogja\apps\api\dist` is created.

- [ ] **Step 8: Commit API workspace move**

Run:

```powershell
git add package.json pnpm-workspace.yaml pnpm-lock.yaml apps\api
git commit -m "chore: move api into pnpm workspace"
```

Expected: commit succeeds.

---

### Task 2: Update Docker for relocated API

**Files:**
- Modify: `D:\Furap-Jogja\Dockerfile`
- Modify: `D:\Furap-Jogja\docker-compose.yml`

- [ ] **Step 1: Replace Dockerfile with workspace-aware API build**

Edit `D:\Furap-Jogja\Dockerfile`:

```dockerfile
FROM node:22-alpine AS deps

WORKDIR /app

ARG PNPM_VERSION=10.11.0
RUN apk add --no-cache openssl \
  && npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @maternalink/api...

FROM deps AS build

COPY apps/api ./apps/api

WORKDIR /app/apps/api

RUN pnpm run prisma:generate
RUN pnpm run build

FROM node:22-alpine AS runner

WORKDIR /app

ARG PNPM_VERSION=10.11.0
ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache netcat-openbsd openssl \
  && npm install -g pnpm@${PNPM_VERSION}

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh

WORKDIR /app/apps/api

EXPOSE 3000

CMD ["sh", "./docker-entrypoint.sh"]
```

- [ ] **Step 2: Keep compose API service behavior unchanged**

Inspect `D:\Furap-Jogja\docker-compose.yml`. Leave port, env, and `build.context: .` unchanged unless Docker build fails because of path assumptions.

Expected retained API service shape:

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DATABASE_URL: postgresql://maternalink:maternalink@postgres:5432/maternalink?schema=public
      RUN_SEED: "true"
    ports:
      - "3000:3000"
```

- [ ] **Step 3: Verify Docker build syntax**

Run:

```powershell
docker compose config
```

Expected: compose config renders without path or YAML errors.

- [ ] **Step 4: Commit Docker update**

Run:

```powershell
git add Dockerfile docker-compose.yml
git commit -m "chore: update docker build for api workspace"
```

Expected: commit succeeds. If `docker-compose.yml` did not change, omit it from `git add`.

---

### Task 3: Scaffold Next.js web workspace

**Files:**
- Create: `D:\Furap-Jogja\apps\web\package.json`
- Create: `D:\Furap-Jogja\apps\web\next.config.ts`
- Create: `D:\Furap-Jogja\apps\web\tsconfig.json`
- Create: `D:\Furap-Jogja\apps\web\next-env.d.ts`
- Create: `D:\Furap-Jogja\apps\web\.env.example`
- Create: `D:\Furap-Jogja\apps\web\src\app\globals.css`

- [ ] **Step 1: Create web folders**

Run:

```powershell
New-Item -ItemType Directory -Force -Path apps\web\src\app,apps\web\src\components,apps\web\src\lib | Out-Null
```

Expected: web source folders exist.

- [ ] **Step 2: Add web package manifest**

Create `D:\Furap-Jogja\apps\web\package.json`:

```json
{
  "name": "@maternalink/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint"
  },
  "dependencies": {
    "@ant-design/icons": "latest",
    "antd": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "typescript": "latest"
  }
}
```

- [ ] **Step 3: Add Next config**

Create `D:\Furap-Jogja\apps\web\next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 4: Add TypeScript config**

Create `D:\Furap-Jogja\apps\web\tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Add Next env declaration**

Create `D:\Furap-Jogja\apps\web\next-env.d.ts`:

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// This file is generated by Next.js conventions and kept in source control for the manual scaffold.
```

- [ ] **Step 6: Add web environment example**

Create `D:\Furap-Jogja\apps\web\.env.example`:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

- [ ] **Step 7: Add global CSS**

Create `D:\Furap-Jogja\apps\web\src\app\globals.css`:

```css
:root {
  color-scheme: light;
  background: #f5f7fb;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
}

body {
  background: #f5f7fb;
}

a {
  color: inherit;
  text-decoration: none;
}
```

- [ ] **Step 8: Install workspace dependencies**

Run:

```powershell
pnpm install
```

Expected: `D:\Furap-Jogja\pnpm-lock.yaml` updates with Next.js, React, Ant Design, and icon packages.

- [ ] **Step 9: Commit web scaffold**

Run:

```powershell
git add apps\web package.json pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "chore: scaffold nextjs web workspace"
```

Expected: commit succeeds.

---

### Task 4: Add API helper and dashboard shell

**Files:**
- Create: `D:\Furap-Jogja\apps\web\src\lib\api.ts`
- Create: `D:\Furap-Jogja\apps\web\src\components\app-shell.tsx`
- Create: `D:\Furap-Jogja\apps\web\src\app\layout.tsx`

- [ ] **Step 1: Add API helper**

Create `D:\Furap-Jogja\apps\web\src\lib\api.ts`:

```ts
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

export type ApiReachability = {
  ok: boolean;
  status?: number;
  message: string;
};

export async function checkApiReachability(): Promise<ApiReachability> {
  try {
    const response = await fetch(`${apiBaseUrl}/master/puskesmas`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: `API returned HTTP ${response.status}`,
      };
    }

    return {
      ok: true,
      status: response.status,
      message: 'API reachable',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown API connection error';

    return {
      ok: false,
      message,
    };
  }
}
```

- [ ] **Step 2: Add Ant Design app shell**

Create `D:\Furap-Jogja\apps\web\src\components\app-shell.tsx`:

```tsx
'use client';

import {
  AlertOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  FormOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { ConfigProvider, Layout, Menu, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const { Header, Content, Sider } = Layout;

const menuItems: MenuProps['items'] = [
  { key: '/', icon: <AppstoreOutlined />, label: <Link href="/">Dashboard</Link> },
  { key: '/master', icon: <DatabaseOutlined />, label: <Link href="/master">Master Data</Link> },
  { key: '/inputs', icon: <FormOutlined />, label: <Link href="/inputs">Inputs</Link> },
  { key: '/forecast', icon: <BarChartOutlined />, label: <Link href="/forecast">Forecast</Link> },
  { key: '/lplpo', icon: <MedicineBoxOutlined />, label: <Link href="/lplpo">LPLPO</Link> },
  { key: '/distribution', icon: <AlertOutlined />, label: <Link href="/distribution">Distribution</Link> },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const selectedKey = menuItems?.some((item) => item && 'key' in item && item.key === pathname) ? pathname : '/';

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily: 'Inter, Arial, sans-serif',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider breakpoint="lg" collapsedWidth="0" width={248} style={{ background: '#ffffff', borderRight: '1px solid #edf0f5' }}>
          <div style={{ padding: 20 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              MaternaLink
            </Typography.Title>
            <Typography.Text type="secondary">Supply planning</Typography.Text>
          </div>
          <Menu mode="inline" selectedKeys={[selectedKey]} items={menuItems} style={{ borderInlineEnd: 0 }} />
        </Sider>
        <Layout>
          <Header style={{ background: '#ffffff', borderBottom: '1px solid #edf0f5', padding: '0 24px' }}>
            <Typography.Text strong>Maternal Health Supply Chain Dashboard</Typography.Text>
          </Header>
          <Content style={{ padding: 24 }}>{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
```

- [ ] **Step 3: Add root layout**

Create `D:\Furap-Jogja\apps\web\src\app\layout.tsx`:

```tsx
import 'antd/dist/reset.css';
import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'MaternaLink Dashboard',
  description: 'Dashboard shell for MaternaLink supply-chain planning.',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Run TypeScript-aware build check**

Run:

```powershell
pnpm --filter @maternalink/web build
```

Expected: build may fail because page files are not created yet. Acceptable failure text should reference missing page route only, not TypeScript errors in `app-shell.tsx`, `layout.tsx`, or `api.ts`.

- [ ] **Step 5: Commit shell foundation**

Run:

```powershell
git add apps\web\src\lib\api.ts apps\web\src\components\app-shell.tsx apps\web\src\app\layout.tsx
git commit -m "feat: add dashboard app shell"
```

Expected: commit succeeds.

---

### Task 5: Add dashboard and module pages

**Files:**
- Create: `D:\Furap-Jogja\apps\web\src\components\module-page.tsx`
- Create: `D:\Furap-Jogja\apps\web\src\app\page.tsx`
- Create: module route pages under `D:\Furap-Jogja\apps\web\src\app`

- [ ] **Step 1: Add reusable module page component**

Create `D:\Furap-Jogja\apps\web\src\components\module-page.tsx`:

```tsx
import { Card, Space, Table, Tag, Typography } from 'antd';

type ModulePageProps = {
  title: string;
  description: string;
  rows: Array<{ key: string; item: string; status: string }>;
};

export function ModulePage({ title, description, rows }: ModulePageProps) {
  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>
          {title}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0, maxWidth: 760 }}>
          {description}
        </Typography.Paragraph>
      </div>
      <Card>
        <Table
          pagination={false}
          dataSource={rows}
          columns={[
            { title: 'Area', dataIndex: 'item', key: 'item' },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (value: string) => <Tag color="blue">{value}</Tag>,
            },
          ]}
        />
      </Card>
    </Space>
  );
}
```

- [ ] **Step 2: Add dashboard home page**

Create `D:\Furap-Jogja\apps\web\src\app\page.tsx`:

```tsx
import { Alert, Card, Col, Row, Space, Statistic, Typography } from 'antd';
import Link from 'next/link';
import { apiBaseUrl, checkApiReachability } from '@/lib/api';

const modules = [
  { title: 'Master Data', href: '/master', value: 4 },
  { title: 'Inputs', href: '/inputs', value: 5 },
  { title: 'Forecast', href: '/forecast', value: 3 },
  { title: 'Distribution', href: '/distribution', value: 2 },
];

export default async function DashboardPage() {
  const reachability = await checkApiReachability();

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>
          Dashboard
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
          Setup dashboard for the existing MaternaLink API workflow.
        </Typography.Paragraph>
      </div>

      <Alert
        type={reachability.ok ? 'success' : 'warning'}
        showIcon
        message={reachability.ok ? 'API reachable' : 'API unavailable'}
        description={`${reachability.message}. Base URL: ${apiBaseUrl}`}
      />

      <Row gutter={[16, 16]}>
        {modules.map((module) => (
          <Col xs={24} sm={12} xl={6} key={module.href}>
            <Link href={module.href}>
              <Card hoverable>
                <Statistic title={module.title} value={module.value} suffix="areas" />
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
```

- [ ] **Step 3: Add master page**

Create `D:\Furap-Jogja\apps\web\src\app\master\page.tsx`:

```tsx
import { ModulePage } from '@/components/module-page';

export default function MasterPage() {
  return (
    <ModulePage
      title="Master Data"
      description="Reference workspace for puskesmas, medicines, maternal conditions, and symptoms from the existing API."
      rows={[
        { key: 'puskesmas', item: 'Puskesmas reference data', status: 'API ready' },
        { key: 'obat', item: 'Medicine reference data', status: 'API ready' },
        { key: 'kondisi', item: 'Maternal condition data', status: 'API ready' },
        { key: 'gejala', item: 'Symptom data', status: 'API ready' },
      ]}
    />
  );
}
```

- [ ] **Step 4: Add inputs page**

Create `D:\Furap-Jogja\apps\web\src\app\inputs\page.tsx`:

```tsx
import { ModulePage } from '@/components/module-page';

export default function InputsPage() {
  return (
    <ModulePage
      title="Inputs"
      description="Monthly clinical, context, stock, symptom, and anamnesis input areas for the existing backend workflow."
      rows={[
        { key: 'diagnosis', item: 'Diagnosis period input', status: 'API ready' },
        { key: 'gejala', item: 'Symptom period input', status: 'API ready' },
        { key: 'konteks', item: 'Context period input', status: 'API ready' },
        { key: 'stok', item: 'Stock input', status: 'API ready' },
        { key: 'anamnesis', item: 'Raw anamnesis input', status: 'API ready' },
      ]}
    />
  );
}
```

- [ ] **Step 5: Add forecast page**

Create `D:\Furap-Jogja\apps\web\src\app\forecast\page.tsx`:

```tsx
import { ModulePage } from '@/components/module-page';

export default function ForecastPage() {
  return (
    <ModulePage
      title="Forecast"
      description="Forecast workspace for deterministic stock prediction runs exposed by the existing API."
      rows={[
        { key: 'run', item: 'Run forecast', status: 'API ready' },
        { key: 'runs', item: 'Forecast run history', status: 'API ready' },
        { key: 'results', item: 'Forecast result details', status: 'API ready' },
      ]}
    />
  );
}
```

- [ ] **Step 6: Add LPLPO page**

Create `D:\Furap-Jogja\apps\web\src\app\lplpo\page.tsx`:

```tsx
import { ModulePage } from '@/components/module-page';

export default function LplpoPage() {
  return (
    <ModulePage
      title="LPLPO"
      description="Predictive LPLPO workspace for generated medicine request rows from forecast results."
      rows={[
        { key: 'generate', item: 'Generate predictive LPLPO', status: 'API ready' },
        { key: 'list', item: 'Filter generated LPLPO rows', status: 'API ready' },
      ]}
    />
  );
}
```

- [ ] **Step 7: Add distribution page**

Create `D:\Furap-Jogja\apps\web\src\app\distribution\page.tsx`:

```tsx
import { ModulePage } from '@/components/module-page';

export default function DistributionPage() {
  return (
    <ModulePage
      title="Distribution"
      description="Allocation plan and alert workspace for route disruption and cold-chain risk simulation."
      rows={[
        { key: 'alerts', item: 'Distribution alerts', status: 'API ready' },
        { key: 'plans', item: 'Allocation plans', status: 'API ready' },
        { key: 'simulate', item: 'Simulation risk checks', status: 'API ready' },
      ]}
    />
  );
}
```

- [ ] **Step 8: Build web app**

Run:

```powershell
pnpm --filter @maternalink/web build
```

Expected: Next.js production build passes.

- [ ] **Step 9: Commit dashboard pages**

Run:

```powershell
git add apps\web\src
git commit -m "feat: add initial dashboard pages"
```

Expected: commit succeeds.

---

### Task 6: Update docs and ignore rules

**Files:**
- Modify: `D:\Furap-Jogja\.gitignore`
- Modify: `D:\Furap-Jogja\README.md`

- [ ] **Step 1: Update gitignore for monorepo build outputs**

Modify `D:\Furap-Jogja\.gitignore` so it includes these lines while preserving existing ignored PDFs and `.env`:

```gitignore
.worktrees/
node_modules/
dist/
apps/*/dist/
apps/*/.next/
apps/*/node_modules/
.env
apps/*/.env
DATASET DIAGRAM.pdf
Master Data.pdf
Problem Research .pdf
Rancangan.pdf
docs/
```

- [ ] **Step 2: Update README quick-start commands**

Modify `D:\Furap-Jogja\README.md` command sections to use workspace paths and scripts:

```markdown
### Run full Docker stack

```bash
docker compose up --build
```

API: `http://localhost:3000/api`
Swagger: `http://localhost:3000/api/docs`

### Local development

```bash
pnpm install
copy apps\api\.env.example apps\api\.env
docker compose up -d postgres
pnpm run prisma:generate
pnpm run prisma:migrate -- --name init_normalized_schema
pnpm run prisma:seed
pnpm run dev:api
```

In a second terminal:

```bash
copy apps\web\.env.example apps\web\.env
pnpm run dev:web
```

Web dashboard: `http://localhost:3001`
```

Expected: README no longer tells users to run backend root-local commands like `pnpm run start:dev` without workspace context.

- [ ] **Step 3: Commit docs update**

Run:

```powershell
git add .gitignore README.md
git commit -m "docs: document monorepo frontend setup"
```

Expected: commit succeeds.

---

### Task 7: Final verification

**Files:**
- Verify generated artifacts only; no source file edits unless commands reveal a real issue.

- [ ] **Step 1: Install from workspace root**

Run:

```powershell
pnpm install
```

Expected: install completes without workspace manifest errors.

- [ ] **Step 2: Generate Prisma client**

Run:

```powershell
pnpm run prisma:generate
```

Expected: Prisma Client generates from `D:\Furap-Jogja\apps\api\prisma\schema.prisma`.

- [ ] **Step 3: Build API**

Run:

```powershell
pnpm --filter @maternalink/api build
```

Expected: NestJS build passes.

- [ ] **Step 4: Build web**

Run:

```powershell
pnpm --filter @maternalink/web build
```

Expected: Next.js build passes.

- [ ] **Step 5: Check Docker compose config**

Run:

```powershell
docker compose config
```

Expected: compose config renders successfully.

- [ ] **Step 6: Optional API e2e if database is running**

Run only if PostgreSQL is reachable through `DATABASE_URL`:

```powershell
pnpm --filter @maternalink/api test:e2e
```

Expected: existing API e2e tests pass. If database is unavailable, record that e2e was skipped because local database was not running.

- [ ] **Step 7: Optional local smoke run**

Run in one terminal:

```powershell
pnpm run dev:api
```

Run in a second terminal:

```powershell
pnpm run dev:web
```

Expected: API listens on `http://localhost:3000/api`; web listens on `http://localhost:3001`; dashboard renders with API status warning or success depending on API/database state.

- [ ] **Step 8: Check final working tree**

Run:

```powershell
git status --short
```

Expected: no unexpected changes remain. If verification revealed a real source issue, fix it in the relevant task section before marking final verification complete.

## Self-Review

- Spec coverage: plan covers pnpm workspaces, backend relocation to `apps/api`, Next.js App Router + TypeScript + Ant Design in `apps/web`, dashboard routes, API env config, port split, Docker backend path updates, README updates, and validation commands.
- Placeholder scan: no red-flag empty-work markers or vague test-only steps remain. UI placeholder content is intentional because the approved spec requested a dashboard shell, not full CRUD.
- Type consistency: package names are `@maternalink/api` and `@maternalink/web`; API base URL env is `NEXT_PUBLIC_API_BASE_URL`; app routes are `/`, `/master`, `/inputs`, `/forecast`, `/lplpo`, `/distribution`.
