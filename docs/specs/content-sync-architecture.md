# Spec: Content Sync Architecture

**Status:** In progress (workflow landed; configure secrets + Pages env)  
**Date:** 2026-07-25  
**Scope:** BH Culture Calendar website, Mobile API / database, iOS app  
**Goal:** One source of truth for events, low cost, secure, simple operations

**Public repo note:** This document is safe to commit. It describes architecture, env **names**, and public routes only. Never paste real API keys, Notion tokens, sync secrets, or deploy-hook URLs here—store those in GitHub Actions secrets / Cloudflare secrets / local `.env.local` (gitignored).

**Infrastructure:** Production is on **Cloudflare** — static site on **Cloudflare Pages**, Mobile API on a **Cloudflare Worker** (or Workers-based stack) at `api.bhculturecalendar.co.uk`. Content rebuilds use a **Pages Deploy Hook**, not empty git commits.

---

## 1. Problem

Today the system has mixed data paths:

| Client | How it gets events | Problem |
|--------|--------------------|---------|
| Website (Next.js static export) | Build-time fetch; historically Notion; now optionally API via `api-events.ts` | Static HTML freezes data until rebuild; dual empty-commit rebuild Actions are noisy and not tied to content sync |
| iOS app | Mobile API (database) | Correct runtime path |
| Sync job | Notion → Mobile API | Exists (`scripts/sync-mobile-api.ts`) but not the single documented pipeline |

Editorial content lives in Notion. Runtime clients should not talk to Notion. Updates are rare (at most once per day; sometimes multi-day gaps). We do not need always-on SSR or continuous redeploys.

---

## 2. Goals

1. **Single source of truth at runtime:** Mobile API database for website *and* iOS app.
2. **Notion is CMS-only:** The only automated process that calls Notion is the content sync job.
3. **Low cost:** Static site hosting, ~1 CI run/day, no always-on web server for content freshness.
4. **Secure:** Notion keys and sync secret never ship to the browser, iOS binary, or site runtime.
5. **Simple ops:** One scheduled pipeline: sync → (on success) redeploy site. Manual trigger for urgent publishes.
6. **Idempotent sync:** Re-running when Notion is unchanged is safe; pruning removes stale rows.

### Non-goals

- Real-time Notion → clients (no webhooks required for v1).
- Authenticated public event reads (calendar data is public).
- Server-rendered Next.js / ISR for content (overkill at daily max cadence).
- Merging the iOS app repo into this monorepo (document the contract only).

---

## 3. Target architecture

```
┌──────────────────────────────────────────────────────────┐
│  Notion (editorial CMS)                                  │
│  Humans add/edit/remove events                           │
└───────────────────────────┬──────────────────────────────┘
                            │
                            │  ONLY via Content Sync job
                            │  (GitHub Action, daily + manual)
                            │  secrets: NOTION_*, MOBILE_SYNC_SECRET
                            ▼
┌──────────────────────────────────────────────────────────┐
│  Mobile API + database                                   │
│  https://api.bhculturecalendar.co.uk                     │
│                                                          │
│  Write: POST /admin/sync-events  (x-sync-secret)         │
│  Read:  GET  /events, /events/today, /venues  (public)   │
└───────────────┬──────────────────────────┬───────────────┘
                │                          │
                │ GET (live)               │ GET at build time
                ▼                          ▼
        ┌───────────────┐         ┌────────────────────────┐
        │  iOS app      │         │  Website (static)      │
        │  runtime read │         │  next.config: export   │
        └───────────────┘         │  redeploy after sync   │
                                  └────────────────────────┘
```

### Roles

| Component | Role |
|-----------|------|
| **Notion** | Source of *edits*. Not a runtime dependency. |
| **Mobile API DB** | Source of *truth* for all product clients. |
| **Content Sync job** | Bridge: Notion → API. Owns secrets. |
| **Website** | Static snapshot of API data, rebuilt after successful sync. |
| **iOS app** | Live client of public API reads. |

---

## 4. Data flow

### 4.1 Happy path (daily or manual)

1. Editor updates Notion (or no-op if nothing changed).
2. GitHub Action **Content Sync** runs (cron or `workflow_dispatch`).
3. Job loads Notion events → maps via `toMobileEvents()` → batch POSTs to `/admin/sync-events`.
4. Job sends finalize (`finalize: true`, `allIds`) so the API prunes rows not in Notion.
5. On success, job triggers site deploy via **Cloudflare Pages Deploy Hook** (`POST` to the hook URL). Fallback: empty commit only if hooks unavailable.
6. Pages runs `next build` with `EVENTS_SOURCE=api`, fetches `GET /events` (and venues as needed), exports static HTML to the CDN.
7. iOS users already see new data as soon as step 4 completes (no site deploy required for the app).

### 4.2 Code / design deploys

- Normal `git push` → host builds site from current API state.
- Does **not** run Notion sync unless intentionally chained.
- Content freshness is independent of feature deploys.

### 4.3 Urgency

- Editor needs events live sooner than next cron → **Run workflow** in GitHub Actions (manual).

---

## 5. Website behaviour

### 5.1 Keep static export

`next.config.ts` remains:

```ts
output: 'export'
```

Rationale: free CDN hosting, strong SEO for baked HTML, no server cost. Daily content cadence does not justify SSR.

### 5.2 Data access

- All pages/components that need events use `src/lib/api-events.ts` (`fetchEvents`, `fetchTodayEvents`, `fetchVenues`).
- Production / CI build env:
  - `EVENTS_SOURCE=api` (or remove Notion branch entirely after migration)
  - `MOBILE_API_URL=https://api.bhculturecalendar.co.uk` (or staging URL)
- **Do not** set `NOTION_API_KEY` / `NOTION_DATABASE_ID` on the site host for production builds.
- Notion module (`src/lib/notion.ts`) may remain for **local sync / admin scripts only**, not for production site runtime.

### 5.3 Rebuild policy

| Trigger | Rebuild site? |
|---------|----------------|
| Successful content sync | **Yes** |
| Sync failed | **No** (keep previous good deploy) |
| No Notion changes for days | Optional: still run daily sync+deploy (simple) or skip deploy if unchanged (optimization) |
| Code-only push | Yes (normal host CI) |

**Default rule (v1):** always redeploy site after a **successful** sync. Once per day max is free-tier friendly. Skip-if-unchanged is a later optimization.

### 5.4 What we remove

- `.github/workflows/daily-rebuild.yml` (empty commit only)
- `.github/workflows/rebuild.yml` (empty commit only)
- Any independent schedule that rebuilds without syncing

Rebuild is a **step after sync**, not a separate product workflow.

---

## 6. Content Sync job

### 6.1 Implementation inputs (existing)

| Item | Location |
|------|----------|
| Script | `scripts/sync-mobile-api.ts` |
| npm scripts | `sync-mobile-api`, `sync:mobile` |
| Mapper | `src/lib/mobile-api.ts` → `toMobileEvents()` |
| Notion reader | `src/lib/notion.ts` → `getEvents()` |

### 6.2 Sync protocol (API contract)

1. `POST /admin/sync-events` with header `x-sync-secret: <MOBILE_SYNC_SECRET>`
2. Body batches: `{ "events": MobileEvent[] }` (batch size 50)
3. Finalize: `{ "events": [], "finalize": true, "allIds": string[] }`
4. API upserts events and prunes IDs not in `allIds`

`MobileEvent` shape (site/sync side):

```ts
{
  id: string
  title: string
  date: string
  endDate: string | null
  category: string[]
  venue: string[]
  postcode: string[]
  location: string | null
  latitude: number | null
  longitude: number | null
  isFree: boolean
  coverImage: string | null
  link: string | null
  slug: string | null
}
```

### 6.3 Proposed GitHub Actions workflow

**Name:** Content Sync  
**File (to add):** `.github/workflows/content-sync.yml`

```yaml
# Conceptual outline — implement in a follow-up PR
name: Content Sync

on:
  schedule:
    - cron: '0 6 * * *'   # once daily UTC; adjust as needed
  workflow_dispatch:

jobs:
  sync-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: npm ci
      - name: Sync Notion → Mobile API
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
          MOBILE_SYNC_SECRET: ${{ secrets.MOBILE_SYNC_SECRET }}
          MOBILE_API_URL: ${{ vars.MOBILE_API_URL || 'https://api.bhculturecalendar.co.uk' }}
        run: npm run sync-mobile-api
      - name: Redeploy Cloudflare Pages
        # Pages Deploy Hook — no git noise; URL is a secret
        run: curl -fsS -X POST "${{ secrets.CLOUDFLARE_PAGES_DEPLOY_HOOK_URL }}"
```

**Create the Deploy Hook (Cloudflare dashboard):**  
Workers & Pages → select Pages project → Settings → Deploy hooks → Add deploy hook.

Docs: [Cloudflare Pages Deploy Hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/)

**Secrets (GitHub):**

| Secret | Purpose |
|--------|---------|
| `NOTION_API_KEY` | Notion read |
| `NOTION_DATABASE_ID` | Notion data source |
| `MOBILE_SYNC_SECRET` | Admin write to API Worker |
| `CLOUDFLARE_PAGES_DEPLOY_HOOK_URL` | Trigger Pages rebuild after sync |

**Variables (optional):** `MOBILE_API_URL` for non-prod targets.

**Cloudflare-side secrets (API Worker):** `MOBILE_SYNC_SECRET` (and DB credentials/bindings as applicable) via `wrangler secret put` or dashboard — not in this git repo.

### 6.4 Failure behaviour

- If Notion fetch fails → job fails; no deploy; app/site keep previous good data.
- If any batch fails → job fails; finalize may be skipped (API should remain consistent per its own transaction rules — document API behaviour if partial batches are possible).
- If finalize fails → job fails; investigate before deploying.
- If deploy hook fails → job fails; **API may already have new data** (app is updated; site lags until hook/retry). Acceptable; re-run workflow.

---

## 7. Mobile API surface (contract for site + iOS)

Public reads (no auth):

| Method | Path | Used by |
|--------|------|---------|
| GET | `/events` | Site build, iOS |
| GET | `/events/today` | Site / iOS as needed |
| GET | `/venues` | Site venues page, iOS |

Protected writes:

| Method | Path | Auth |
|--------|------|------|
| POST | `/admin/sync-events` | `x-sync-secret` |

### Security requirements (API)

- Sync secret is long, random, rotated if leaked.
- Admin routes not linked from public docs/UI.
- Rate-limit admin routes if feasible.
- HTTPS only.
- Public GET is fine for public calendar content; do not put PII in event payloads.

### Site mapping notes

`src/lib/api-events.ts` maps API venue payloads into the UI `Venue` type. Keep API response fields stable; version or document breaking changes for the iOS app.

---

## 8. iOS app (external)

This repo does not contain the iOS app. Architectural expectations:

1. **Read-only** against the same public base URL (`MOBILE_API_URL`).
2. **Never** embed `NOTION_*` or `MOBILE_SYNC_SECRET`.
3. Treat API as source of truth; offline cache is a client concern (stale-while-revalidate is fine).
4. After a successful daily sync, cold start / pull-to-refresh shows new events without waiting for the website deploy.
5. Coordinate `MobileEvent` (or server DTO) fields with `src/lib/mobile-api.ts` when changing schema.

Suggested iOS env:

- Production: `https://api.bhculturecalendar.co.uk`
- Staging: separate API if available

---

## 9. Environment matrix

| Variable | Sync job (GHA) | Pages build | iOS app | API Worker |
|----------|-----------------|-------------|---------|------------|
| `NOTION_API_KEY` | ✓ | ✗ | ✗ | ✗ |
| `NOTION_DATABASE_ID` | ✓ | ✗ | ✗ | ✗ |
| `MOBILE_SYNC_SECRET` | ✓ | ✗ | ✗ | ✓ (verify) |
| `MOBILE_API_URL` | ✓ | ✓ | ✓ (config) | n/a |
| `EVENTS_SOURCE` | ✗ | `api` | ✗ | ✗ |
| `CLOUDFLARE_PAGES_DEPLOY_HOOK_URL` | ✓ | ✗ | ✗ | ✗ |

Local development:

- Website: `EVENTS_SOURCE=api` against prod/staging API, **or** `notion` only for emergency debugging (do not rely on it long-term).
- Sync: `.env.local` with Notion + sync secret (already supported by script).

---

## 10. Migration plan

### Phase 0 — Document (this spec + AGENTS.md)

- Land architecture docs. No behaviour change required.

### Phase 1 — Site on API only

1. Confirm production site build uses `EVENTS_SOURCE=api` and `MOBILE_API_URL`.
2. Verify `whats-on`, location pages, venues, about all go through `api-events.ts`.
3. Remove or hard-disable Notion path in production builds (keep script imports for sync).
4. Smoke-test a local `next build` against the live API.

### Phase 2 — Single Content Sync workflow

1. Add `.github/workflows/content-sync.yml` (sync + Cloudflare Pages Deploy Hook).
2. Create Deploy Hook in Cloudflare Pages settings; store URL in GitHub secret `CLOUDFLARE_PAGES_DEPLOY_HOOK_URL`.
3. Configure remaining GitHub secrets (`NOTION_*`, `MOBILE_SYNC_SECRET`).
4. Set Pages build env: `EVENTS_SOURCE=api`, `MOBILE_API_URL=…`.
5. Run workflow manually; confirm API rows and a new Pages deployment (source: Deploy Hook).
6. Disable/delete `daily-rebuild.yml` and `rebuild.yml`.

### Phase 3 — Harden

1. Confirm Pages project has no Notion secrets (only public `MOBILE_API_URL` / `EVENTS_SOURCE`).
2. Confirm API Worker secrets via Cloudflare dashboard / `wrangler secret`.
3. Optional: sync job prints summary (counts inserted/pruned) to Action logs.
4. Optional later: skip deploy when content hash unchanged.

### Phase 4 — Cleanup

1. Stop using empty-commit bots.
2. Trim dead Notion-only site paths if unused.
3. Align README with AGENTS.md.

---

## 11. Acceptance criteria

- [ ] Notion is not called during production website build or runtime.
- [ ] iOS and website event lists both originate from the Mobile API DB (website via build-time snapshot).
- [ ] One primary scheduled workflow performs sync; site redeploy runs only after successful sync.
- [ ] Independent empty-commit rebuild workflows are removed.
- [ ] Sync secret and Notion keys exist only in CI secrets (+ API server for the secret).
- [ ] Manual workflow run publishes content without a code change.
- [ ] Failed sync does not wipe the previous site deploy.
- [ ] Running sync twice with identical Notion data does not corrupt the API (idempotent upsert + prune).

---

## 12. Cost model

| Resource | Cadence | Notes |
|----------|---------|--------|
| GitHub Actions | ≤1 scheduled run/day + manual | Free tier usually enough (private repos have monthly minute caps) |
| Cloudflare Pages | Build after sync + code pushes | Free tier fits daily rebuilds |
| Cloudflare Workers (API) | ~1 write burst/day; reads from app + builds | Free/paid tier per existing plan |
| Notion API | Read once per sync | CMS free/personal tier usually enough |

No SSR, no always-warm Next server, no dual rebuild bots. Cloudflare free tiers are a good fit for this cadence.

---

## 13. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Deploy hook fails after sync | App is correct; re-run workflow; alert on job failure |
| Partial batch failure mid-sync | Fail job; fix API to be transactional or re-run full sync |
| Schema drift site vs iOS | Single mapper `toMobileEvents`; document fields in this spec |
| Static site shows “today” wrong near midnight UTC | Accept daily snapshot; or schedule sync closer to morning local time |
| Someone re-enables Notion for site | AGENTS.md + CI env checks (`EVENTS_SOURCE=api`) |

---

## 14. Decisions log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cloud platform | Cloudflare (Pages + Workers) | Existing infra; free-friendly; Deploy Hooks |
| Site hosting model | Keep `output: 'export'` on Pages | Free, simple, enough for ≤1 update/day |
| Freshness mechanism | Sync then Pages Deploy Hook | Ties rebuild to real content change path |
| Rebuild without sync | Remove | Avoids empty git noise and false “freshness” |
| Public event GET auth | None | Public calendar data |
| Notion at runtime | Forbidden for site/app | Security + single truth |

---

## 15. Related files in this repo

| Path | Role |
|------|------|
| `AGENTS.md` | Agent-facing architecture & rules |
| `src/lib/api-events.ts` | Website → API (or Notion fallback) |
| `src/lib/notion.ts` | Notion reader (sync / legacy) |
| `src/lib/mobile-api.ts` | Event DTO mapping for API |
| `src/lib/types.ts` | Website `Event` / `Venue` types |
| `scripts/sync-mobile-api.ts` | Notion → API sync CLI |
| `next.config.ts` | Static export |
| `.github/workflows/*` | CI (to be replaced by content-sync) |

---

## 16. Open items (resolve during implementation)

1. Exact Cloudflare Pages project name and production branch (for Deploy Hook + build settings).
2. Preferred daily cron time (UK morning vs UTC midnight).
3. Whether staging API / staging Pages project exists for dry runs.
4. API Worker behaviour on partial batch failure (document server-side).
5. Whether image assets remain on site (`public/images`, `image-map.json`) or move fully to URLs from API/`coverImage` (R2 optional later).
6. Private GitHub repo: confirm Cloudflare Git integration still has access after visibility change.

*End of spec.*
