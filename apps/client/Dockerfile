# Client SPA. Built with Vite, then served as static files by nginx, which also
# reverse-proxies /api to the API so the browser stays same-origin.
# The build context is the monorepo root (see compose).
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --filter client...
RUN pnpm --filter client build

FROM nginx:1.27-alpine AS runtime
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/client/dist /usr/share/nginx/html
EXPOSE 80
