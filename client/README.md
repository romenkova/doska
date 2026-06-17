# Deck

A Kanban board web app with markdown cards

## Tech stack

| Area        | Choice                                            |
| ----------- | ------------------------------------------------- |
| Framework   | React 19 + TypeScript                             |
| Build       | Vite                                              |
| Styling     | Tailwind CSS v4                                    |
| UI          | shadcn + Base UI (`@base-ui/react`)               |
| Data        | TanStack Query over an IndexedDB store            |
| Routing     | wouter                                             |
| Drag & drop | `@hello-pangea/dnd`                               |
| Markdown    | react-markdown + remark-gfm                        |
| E2E tests   | Playwright                                         |

## Getting started

The app lives in [`client/`](./client). Requires Node 20+ and pnpm.

```bash
cd client
pnpm install
pnpm dev          # start the Vite dev server
```

Then open the URL Vite prints (default http://localhost:5173).

## Scripts

Run from `client/`:

| Command           | Description                                   |
| ----------------- | --------------------------------------------- |
| `pnpm dev`        | Start the dev server                          |
| `pnpm build`      | Type-check and build for production           |
| `pnpm preview`    | Serve the production build (port 3001)         |
| `pnpm typecheck`  | Type-check without emitting                   |
| `pnpm lint`       | Run ESLint                                     |
| `pnpm format`     | Format with Prettier                          |
| `pnpm e2e`        | Run Playwright end-to-end tests               |
| `pnpm e2e:ui`     | Run Playwright in UI mode                     |

## Testing

Playwright tests live in [`client/e2e`](./client/e2e) and cover board/card CRUD,
drag-and-drop, routing, and sync persistence. The suite builds the app and runs
against the production bundle via `vite preview`, so no separate server is
needed:

```bash
cd client
pnpm e2e
```

## Project structure

```
client/
  src/
    components/
      domain/      # app features: deck, column, card, sidebar, markdown
      ui/          # shadcn / Base UI primitives
    lib/
      api/         # IndexedDB store (db, idb) + background sync
      data/        # TanStack Query keys, queries, mutations
      hooks/       # shared hooks
      routes.ts    # route patterns and path builders
    router.tsx     # wouter routes
  e2e/             # Playwright specs
```

## Architecture notes

- **Storage** — each card and board is its own IndexedDB record, so a write
  touches only what changed. The store is seeded once from static fixtures on
  first run (`src/lib/api/db.ts`).
- **Sync** — changes are recorded as `store/key` dirty refs, persisted to
  `localStorage` so pending changes survive a reload, and flushed on a 30s
  interval (`src/lib/api/sync.ts`). Wiring this to a real backend is the main
  open piece.
