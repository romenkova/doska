# Marketing site. Vite prerenders it to static HTML at build time, so the
# runtime is nginx and nothing else — no API, no server to talk to.
# The build context is the monorepo root (see compose).
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --filter landing...
RUN pnpm --filter landing build

FROM nginx:1.27-alpine AS runtime
COPY apps/landing/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/landing/dist /usr/share/nginx/html
EXPOSE 80
