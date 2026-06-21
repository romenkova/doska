# API server. It runs TypeScript directly with tsx in production — the
# @deck/contract workspace package is consumed as .ts source, so there is no
# separate compile step. The build context is the monorepo root (see compose).
FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
# Copy the whole workspace, then install only `server` and the workspace
# packages it depends on (skips the client/e2e dep trees entirely).
COPY . .
RUN pnpm install --frozen-lockfile --filter server...

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/server
EXPOSE 3000
# Migrations run on boot (see src/index.ts) before the server accepts traffic.
CMD ["pnpm", "start"]
