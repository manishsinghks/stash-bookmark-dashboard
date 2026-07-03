# Stash — Personal Bookmark Dashboard

A premium, macOS-feeling bookmark manager built with Next.js 15. Organize, search, and rediscover everything you save — with a Linear/Raycast-inspired design, buttery animations, and full keyboard support.

## Quick start

Needs a Postgres database — a free [Neon](https://neon.tech) project or `vercel env pull` from a linked project both work.

```bash
npm install
cp .env.example .env     # fill in DATABASE_URL
npx prisma db push       # creates tables
npx prisma db seed       # 10 smart categories + sample bookmarks
npm run dev              # http://localhost:3000
```

## Deploying to Vercel

1. Push this repo to GitHub, then **Import Project** on [vercel.com](https://vercel.com) (root directory: repo root — the `extension/` folder is a separate package and is ignored by the Next.js build).
2. In the project's **Storage** tab, create a **Postgres** database (Neon-backed). This automatically sets `DATABASE_URL` for the project.
3. Deploy. The build runs `prisma db push` before `next build`, so tables are created/synced automatically — no manual migration step needed.
4. Optional: run `npx prisma db seed` locally against the same `DATABASE_URL` if you want the production database to start with sample data instead of empty.

## Features

- **Bookmarks** — add by URL with automatic metadata (title, description, favicon, OG image, theme color), edit, duplicate, soft-delete with undo toast
- **Organization** — 10 built-in smart categories + custom ones (icon & color), unlimited collections, tags with autocomplete
- **Search** — instant Fuse.js fuzzy search across name/URL/description/notes/tags/category/collection, inside a ⌘K command palette with quick actions
- **Filters & sort** — category, tag, favorites, recent; newest / oldest / A–Z / most-visited
- **Power UX** — right-click context menu, multi-select (⌘-click, shift-range) with bulk favorite/move/tag/delete, drag cards onto sidebar collections, infinite scroll, arrow-key grid navigation
- **Analytics** — totals, most visited, recently opened, top tags, category breakdown, weekly & monthly activity charts
- **Import / Export** — import Chrome/Edge/Firefox/Brave/Safari HTML exports, JSON, CSV (with duplicate skipping and folder → collection mapping); export JSON, CSV, HTML (Netscape), Markdown
- **Settings** — light/dark/system theme, 6 accent colors (live CSS variable swap), grid density, default sort, backup & restore, reset preferences
- **Offline-aware** — persisted query cache renders your library offline, with a status banner

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| ⌘K | Search / command palette |
| ⌘N | New bookmark |
| ⌘D | Toggle dark mode |
| ↑ ↓ ← → | Move between cards |
| Enter | Open focused bookmark |
| E | Edit focused bookmark |
| ⌫ / Delete | Delete focused bookmark |
| Space | Select focused bookmark |

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · Framer Motion · TanStack Query v5 · Zustand · Prisma + Postgres · React Hook Form + Zod · Fuse.js · Recharts · dnd-kit · Lucide

A companion Manifest V3 browser extension lives in [`extension/`](extension/README.md).

## Architecture

```
src/
  app/(app)/          # pages: dashboard, bookmarks, favorites, recent,
                      # collections(+detail), tags, analytics, settings
  app/api/            # REST routes (Zod-validated, shared error envelope)
  components/         # ui (shadcn) · layout · bookmarks · collections ·
                      # categories · search · analytics · import-export · shared · dnd
  hooks/              # TanStack Query hooks, fuzzy search, keyboard shortcuts
  lib/                # prisma client, validations, importers/exporters, metadata, icons
  services/           # typed API client
  stores/             # zustand: ui state + persisted settings
  types/              # DTOs crossing the API boundary
prisma/               # schema, migrations, seed
```

Notes:
- Deletes are soft (`deletedAt`) so the undo toast can restore; bulk delete asks for confirmation first.
- "Open in Incognito" copies the URL with instructions — browsers don't allow web pages to open private windows.
- Activity events (created/visited/favorited/deleted) power the analytics charts.
