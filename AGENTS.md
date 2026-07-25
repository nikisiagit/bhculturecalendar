# AGENTS.md — BH Culture Calendar

Guidance for coding agents and humans working in this repository.

**Canonical architecture spec:** [`docs/specs/content-sync-architecture.md`](docs/specs/content-sync-architecture.md)

### Public repository — what may appear in git

This repo may be **public on GitHub**. These docs intentionally contain only:

- Architecture and file paths  
- **Names** of environment variables (not values)  
- Public site/API hostnames and public read routes  

**Never commit:** API keys, Notion tokens, sync secrets, deploy-hook URLs with tokens, `.env` / `.env.local`, private PATs, or real credential values in examples. Use GitHub Actions **secrets** / host env for those. If a secret is ever committed, rotate it immediately.

---

## What this monorepo is

This repo is the **BH Culture Calendar website** (Next.js) plus the **content sync tooling** that pushes Notion events into the **Mobile API database**.

It does **not** contain the iOS app binary/project. The iOS app is a separate client that reads the same Mobile API. Treat the API contract as a shared boundary.

| Piece | Location / URL | Role |
|-------|----------------|------|
| Website | This repo (`src/`) → **Cloudflare Pages** (static export) | Public static site: what’s on, venues, about |
| Content sync | `scripts/sync-mobile-api.ts` (GitHub Actions) | Notion → Mobile API (CI + local) |
| Mobile API + DB | `https://api.bhculturecalendar.co.uk` (**Cloudflare** Worker/API + store) | Runtime source of truth for events |
| iOS app | External repo | Live client of the Mobile API |
| Notion | External CMS | Editorial source of edits only |
| Edge / DNS / CDN | **Cloudflare** | Hosting, TLS, caching for site + API |

**Infrastructure assumption:** Cloudflare is the production platform (Pages for the static site; Workers/API for the mobile backend). Prefer Cloudflare-native mechanisms (e.g. **Pages Deploy Hooks**) over empty git commits for content rebuilds.

---

## Architecture (target state)

```
Notion (CMS — humans edit)
        │
        │  Content Sync job only
        │  (GitHub Action daily + manual)
        ▼
Mobile API + database   ←── single runtime source of truth
        │
        ├── iOS app     GET /events (live at runtime)
        └── Website     GET /events (at static build time, then CDN)
```

### Principles

1. **One runtime source of truth:** the Mobile API database — not Notion, not a second site-only DB.
2. **Notion is write-path only for the sync job.** Site builds and the iOS app must not call Notion in production.
3. **Website is static** (`output: 'export'`). Event data is snapshotted at build time from the API.
4. **Near real-time target (~1 minute):** Notion → Content Sync (webhook `repository_dispatch` or 5‑min cron) → API. Site polls API every ~45s in the browser; app reads API live. See [`docs/near-realtime.md`](docs/near-realtime.md).
5. **Static HTML is a snapshot for SEO/first paint.** Do not rely on Pages rebuild alone for “within a minute.”
6. **Secrets stay off clients.** No Notion keys or sync secrets in the browser, iOS app, or public env. Public API GETs only.

### What is in sync when?

| After… | Mobile API / iOS | Static website |
|--------|------------------|----------------|
| Successful Content Sync | Updated immediately | Updated after post-sync deploy |
| Failed sync | Unchanged | Unchanged (keep last good deploy) |
| Code-only git push | Unchanged | Rebuilds from **current** API data |

---

## Repository map

```
src/
  app/                 # Next.js App Router pages (static export)
  components/          # UI (EventsClient, filters, header, …)
  lib/
    api-events.ts      # Website data access → Mobile API (preferred)
    notion.ts          # Notion client — sync scripts / legacy fallback only
    mobile-api.ts      # MobileEvent type + toMobileEvents() mapper
    types.ts           # Website Event / Venue types
    location.ts        # Postcode/locality + venue coordinates helpers
  data/
    image-map.json
    venue-coordinates.json
scripts/
  sync-mobile-api.ts   # Notion → API sync CLI
  download-images.js
.github/workflows/     # CI — target: single content-sync workflow
docs/specs/            # Architecture and change specs
```

### npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local Next dev server |
| `npm run build` | Static export production build |
| `npm run sync-mobile-api` / `sync:mobile` | Run Notion → API sync |
| `npm run verify:content` | Automated checks: API health + Notion ↔ API parity (fails CI if DB stale/wrong) |
| `npm run verify:api` | Public API health only (app/site read path) |
| `npm run sync:verify` | Sync then full verify |

Full walkthrough: [`docs/setup-and-verification.md`](docs/setup-and-verification.md)

---

## Data access rules (website)

### Do

- Load events/venues through **`src/lib/api-events.ts`** (`fetchEvents`, `fetchTodayEvents`, `fetchVenues`).
- Production / CI: `EVENTS_SOURCE=api` and `MOBILE_API_URL` pointing at the real API.
- Keep pages as Server Components that call `api-events` at **build time** (static export).

### Don’t

- Don’t call `getEvents()` from `notion.ts` in page components for production paths.
- Don’t add `NOTION_API_KEY` to the site host for production builds.
- Don’t introduce a second events database “just for the website.”
- Don’t reintroduce scheduled empty-commit rebuild workflows as the content strategy.

### Env (website build)

| Variable | Production value |
|----------|------------------|
| `EVENTS_SOURCE` | `api` |
| `MOBILE_API_URL` | `https://api.bhculturecalendar.co.uk` (or staging) |

`EVENTS_SOURCE=notion` is a **local/emergency fallback only**, not the architecture target.

---

## Content Sync (Notion → API)

**Script:** `scripts/sync-mobile-api.ts`  
**Mapper:** `toMobileEvents()` in `src/lib/mobile-api.ts`

Flow:

1. Read all events from Notion (`getEvents()`).
2. Map to `MobileEvent[]` (includes lat/long, slug, location).
3. `POST {MOBILE_API_URL}/admin/sync-events` in batches of 50 with header `x-sync-secret`.
4. Finalize with `{ events: [], finalize: true, allIds: [...] }` to prune stale rows.

### Secrets (sync job / local `.env.local` only)

| Variable | Required |
|----------|----------|
| `NOTION_API_KEY` | yes |
| `NOTION_DATABASE_ID` | yes |
| `MOBILE_SYNC_SECRET` (or `SYNC_SECRET`) | yes |
| `MOBILE_API_URL` | optional (defaults to production API) |

### CI target

Workflow **Content Sync** (`.github/workflows/content-sync.yml`):

1. `npm run sync-mobile-api` — Notion → API  
2. `npm run verify:content` — **must pass** or job fails  
3. Cloudflare Pages Deploy Hook — SEO shell (optional if secret missing; users still get live client data)

**Triggers:** `repository_dispatch` (`notion-update` / `content-sync`), `workflow_dispatch`, optional GH schedule.

**Preferred reliable timer (CF only):** [`workers/content-sync-trigger/`](workers/content-sync-trigger/) — cron every 15 min + `POST /trigger` → GitHub dispatch. No Make/Zapier.

Site live path: `useLiveEvents` + `client-api.ts` → `GET /events` every 45s.  
Full near-realtime setup: [`docs/near-realtime.md`](docs/near-realtime.md).

---

## Mobile API contract (shared with iOS)

Base URL (production): `https://api.bhculturecalendar.co.uk`

| Method | Path | Auth | Consumers |
|--------|------|------|-----------|
| GET | `/events` | none | Site build, iOS |
| GET | `/events/today` | none | Site, iOS |
| GET | `/venues` | none | Site, iOS |
| POST | `/admin/sync-events` | `x-sync-secret` | Sync job only |

When changing payload fields:

1. Update `MobileEvent` / `toMobileEvents()` here.
2. Coordinate the iOS model and any API server schema.
3. Note breaking changes in the architecture spec or PR description.

Public calendar data → public GETs are intentional. Never put the sync secret in the app or frontend.

---

## iOS app (external) — agent notes

If a task mentions the iOS app:

- It **reads** the Mobile API; it does **not** sync from Notion.
- It should never receive Notion or admin secrets.
- Content appears on the app as soon as sync finishes; it does not wait for the website rebuild.
- Schema alignment lives in this repo’s `mobile-api.ts` + the API server + the iOS models.

This repo’s job for iOS is: keep the sync mapper and documented API contract accurate.

---

## Website stack facts

- **Next.js** App Router, **static export** (`next.config.ts` → `output: 'export'`).
- Images: `images.unoptimized: true` (required for static export).
- Main UX: `/whats-on`, `/whats-on/[location]`, `/venues`, `/about`.
- Home (`/`) redirects to `/whats-on`.

Static export implications:

- `fetch` in Server Components runs at **build time**, not per visitor.
- Fresh events require a **new deploy** after the API has been updated (via Content Sync pipeline).
- Do not assume `revalidate` / ISR works under `output: 'export'`.

---

## Security checklist for agents

| Secret | Allowed in |
|--------|------------|
| `NOTION_*` | GitHub Actions sync job, local `.env.local` for sync |
| `MOBILE_SYNC_SECRET` | Sync job, API Worker secrets (e.g. `wrangler secret`) |
| `CLOUDFLARE_DEPLOY_HOOK` | GitHub Actions only (Pages deploy hook URL is a secret) |
| `MOBILE_API_URL` | Site build, sync job, iOS config (public URL OK) |
| Cloudflare API tokens | Only if using Wrangler/CI deploy; never in client code |

Never commit `.env`, `.env.local`, or files containing secret **values**. Never log full secrets. Prefer **Cloudflare Pages Deploy Hooks** over empty commits or shared PATs for content rebuilds. Public docs may name routes and env vars; protection of write endpoints is the secret + Worker checks, not obscurity.

### Cloudflare-specific notes

- **Pages** builds the static export (`next build` with `output: 'export'`). Build env: `EVENTS_SOURCE=api`, `MOBILE_API_URL=…`.
- **Deploy Hook** rebuilds Pages after content sync without a new git commit.
- **API Worker** holds `MOBILE_SYNC_SECRET` and DB bindings; public GET routes need no auth.
- Private GitHub repo: Cloudflare Pages can still build from a connected private repo if the Cloudflare GitHub app has access.
- Free/cheap path: Pages free tier + Workers free tier is enough for daily sync + public calendar traffic at small scale.

---

## Implementation status (keep this honest)

Update this section when work lands.

| Item | Status |
|------|--------|
| `api-events.ts` API path | Present (`EVENTS_SOURCE` default `api`) |
| Sync script | Present (`scripts/sync-mobile-api.ts`) |
| Verify script (Notion ↔ API) | Present (`scripts/verify-content.ts`) |
| Single Content Sync GHA | Present — sync → verify → Deploy Hook |
| Deploy hook after sync | Wired (set `CLOUDFLARE_DEPLOY_HOOK`) |
| Empty-commit rebuild workflows | Removed |
| Setup walkthrough | [`docs/setup-and-verification.md`](docs/setup-and-verification.md) |
| Production site Notion-free | Confirm Pages env on Cloudflare |

---

## How agents should work here

1. **Read the spec** for content/sync/architecture tasks: `docs/specs/content-sync-architecture.md`.
2. **Prefer small diffs** that move toward the target architecture; don’t reintroduce Notion into page data loading.
3. **Don’t add cost** (extra always-on services, dual DBs, frequent rebuild spam) without an explicit request.
4. **Site UI work** can stay local to `src/components` and `src/app`; still load data via `api-events`.
5. **Sync/API contract changes** need care for the external iOS app — call that out in the PR/summary.
6. **Verification:** `npm run build` for site; `npm run sync-mobile-api` only with real secrets and intent (writes to API).

---

## Related docs

- [`docs/specs/content-sync-architecture.md`](docs/specs/content-sync-architecture.md) — full architecture change spec, migration phases, acceptance criteria
- [`README.md`](README.md) — generic Next.js bootstrap notes (may lag AGENTS.md; prefer this file for product architecture)
