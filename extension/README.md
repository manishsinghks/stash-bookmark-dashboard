# Stash Browser Extension

Official companion extension for the [Stash bookmark dashboard](../README.md). Save any page into your dashboard with one click — with smart categorization, duplicate detection, offline queueing, and instant dashboard refresh.

Works in **Chrome, Edge, Brave, and Opera** (Manifest V3, `minimum_chrome_version: 116`).

## Installation (unpacked)

```bash
cd extension
npm install
npm run build        # → dist/
```

1. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`, `opera://extensions`)
2. Enable **Developer mode**
3. Click **Load unpacked** and select `extension/dist`
4. Make sure the dashboard is running (`npm run dev` in the repo root, http://localhost:3000)

## Development

```bash
npm run dev          # vite build --watch: rebuilds dist/ on save
npm run typecheck    # strict TS, no emit
npm run build        # typecheck + production build
```

After a rebuild, click the reload icon on the extension card in `chrome://extensions`.

## Features

- **Popup save** — auto-filled title, description, favicon, OG image; editable category (with a ✨ suggested pick), collection, tags with autocomplete, notes, favorite. Buttons: Save · Save & open dashboard · Cancel.
- **Auto Save Mode** — flip it in settings and clicking the toolbar icon saves instantly with a notification (no popup).
- **Keyboard shortcut** — `⌘⇧S` (macOS) / `Ctrl+Shift+S` (Windows/Linux) saves the current page from anywhere.
- **Context menus** — right-click to save the page, a link (metadata fetched server-side), an image, or selected text (saved into notes).
- **Duplicate detection** — before saving, the URL is checked against the dashboard; the popup offers *Open existing / Update bookmark / Create duplicate / Cancel*.
- **Offline mode** — unreachable dashboard? Saves queue in `chrome.storage.local`, the toolbar badge shows the pending count, and a background alarm drains the queue every 2 minutes. Nothing is lost.
- **Notifications** — saved / already exists / saved offline / sync complete / sync failed (toggleable).
- **Settings page** — dashboard URL (with runtime permission grant for custom origins), theme, auto save, notifications, offline mode, shortcut customization link, log export, developer mode.

## Folder structure

```
extension/
├── public/              # manifest.json + icons (copied verbatim to dist/)
├── popup.html           # popup entry
├── options.html         # settings entry
└── src/
    ├── popup/           # React popup app (save form, duplicate flow)
    ├── options/         # React settings app
    ├── background/      # MV3 service worker: quick save, menus, sync, badge
    ├── content/         # metadata extractor injected via chrome.scripting
    ├── api/             # typed dashboard API client (retry + zod validation)
    ├── services/        # settings, offline queue, logger, save orchestration, ai/
    ├── hooks/           # useCurrentTab, useSettings, useTaxonomies
    ├── components/ui/   # shadcn-style primitives (same design tokens)
    ├── utils/           # cn, url normalization, smart categorization
    ├── types/           # DTOs + validated runtime messages
    └── styles/          # design tokens copied from the dashboard
```

## Architecture

- **No persistent content script.** Page metadata is extracted on demand with `chrome.scripting.executeScript({ func })` — the function in `src/content/metadata-extractor.ts` is serialized into the page only when you invoke the extension. Fewer permissions, zero idle cost.
- **Everything goes through the dashboard API.** The extension has no database logic. The client (`src/api/client.ts`) validates payloads with zod before sending and retries network failures/5xx with exponential backoff (2 retries).
- **State lives in `chrome.storage`.** Settings in `storage.sync` (roams with the profile), the offline queue and logs in `storage.local`. The MV3 worker can be killed at any time without losing anything.
- **Typed, validated messaging.** Popup/options → background messages are a zod discriminated union (`src/types/messages.ts`); unvalidated payloads are ignored.
- **AI-ready service layer.** `src/services/ai/` defines an `AiProvider` interface (suggestTags, summarize, findSimilar, semantic duplicate/search, enrich). A `NoopAiProvider` is registered today; every save already flows through `ai().enrich(...)`, so real AI plugs in without UI changes.
- **Design parity.** `src/styles/globals.css` carries the dashboard's exact OKLCH token set (light + dark), Inter, and the same glass/shadow utilities.

## API flow

```
Popup / Shortcut / Context menu
        │
        ▼
services/save.ts ── lookup ──▶ GET  /api/bookmarks/lookup?url=…   (duplicate check)
        │                      POST /api/bookmarks                (create)
        │                      PATCH /api/bookmarks/:id           (update duplicate)
        │                      POST /api/metadata                 (link saves)
        │
        ├─ unreachable? → services/queue.ts (chrome.storage.local)
        │                  └─ background alarm → drain queue → badge/notification
        │
        └─ success → notifyDashboardTabs(): postMessage into open dashboard
                     tabs → dashboard's use-extension-sync hook invalidates
                     TanStack Query caches → UI updates without a refresh
```

## Dashboard-side integration (already included in the repo)

- `GET /api/bookmarks/lookup` — exact-URL duplicate lookup
- `src/hooks/use-extension-sync.ts` — listens for the extension's postMessage and invalidates queries
- `refetchOnWindowFocus: true` — switching to the dashboard tab always shows fresh data

## Security notes

- Host permissions are limited to `localhost:3000` by default; other dashboard origins are requested at runtime (`optional_host_permissions`) only when you configure them.
- All inputs are zod-validated on both sides of the API; runtime messages are validated on receipt.
- Logs never contain page content or notes — events only.
- No remote code, no analytics, no secrets in the bundle.
