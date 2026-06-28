# API server. It runs TypeScript directly with tsx in production — the
# @doska/contract workspace package is consumed as .ts source, so there is no
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
# Bake the release version into the image so a prebuilt/published image (e.g.
# ghcr.io/.../doska-server:0.3.2) self-describes its /api/version without the
# puller setting anything or having git. The publishing CI passes the tag:
#   docker build --build-arg APP_VERSION=0.3.2 ...
# A runtime APP_VERSION (compose `environment:`) still overrides this, and if
# neither is set the server falls back to package.json.
ARG APP_VERSION=""
ENV APP_VERSION=${APP_VERSION}
COPY --from=build /app /app
WORKDIR /app/apps/server
EXPOSE 3000
# Migrations run on boot (see src/index.ts) before the server accepts traffic.
CMD ["pnpm", "start"]
