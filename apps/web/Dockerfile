FROM node:22-alpine AS deps

WORKDIR /app

ARG PNPM_VERSION=10.11.0
RUN npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile --filter @maternalink/web...

FROM deps AS build

ARG API_INTERNAL_BASE_URL=http://api:3001/api
ARG NEXT_PUBLIC_API_BASE_URL=/api
ENV API_INTERNAL_BASE_URL=${API_INTERNAL_BASE_URL}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

COPY apps/web ./apps/web

WORKDIR /app/apps/web

RUN pnpm run build

FROM node:22-alpine AS runner

WORKDIR /app

ARG PNPM_VERSION=10.11.0
ENV NODE_ENV=production
ENV PORT=3000
ARG API_INTERNAL_BASE_URL=http://api:3001/api
ARG NEXT_PUBLIC_API_BASE_URL=/api
ENV API_INTERNAL_BASE_URL=${API_INTERNAL_BASE_URL}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

RUN npm install -g pnpm@${PNPM_VERSION}

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/web/next.config.ts ./apps/web/next.config.ts

EXPOSE 3000

CMD ["pnpm", "--filter", "@maternalink/web", "start"]
