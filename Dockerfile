FROM node:22-alpine AS deps

WORKDIR /app

ARG PNPM_VERSION=10.11.0
RUN apk add --no-cache openssl \
  && npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY prisma ./prisma
COPY src ./src
COPY nest-cli.json tsconfig.json ./

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
COPY --from=build /app/dist ./dist
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh

EXPOSE 3000

CMD ["sh", "./docker-entrypoint.sh"]
