# Setup & verification walkthrough

End-to-end guide so the **site** and **iOS app** stay aligned with **Notion** via the **Mobile API**, with automated checks that fail when the DB/API is wrong.

Related: [content-sync architecture](./specs/content-sync-architecture.md) · [AGENTS.md](../AGENTS.md)

---

## Target flow

```
Notion (edit)
   → Content Sync (GitHub Action or local)
   → Mobile API / DB  ←── verified by npm run verify:content
   → iOS app (live GET /events)
   → Cloudflare Pages rebuild (Deploy Hook) → static site
```

**Automated tests do not open the iOS binary.** They prove the **same public API** the app and site use is healthy and matches Notion. If that passes after sync, both clients get correct data (app immediately; site after Pages deploy).

---

## Part A — One-time setup

### A1. Local secrets (`.env.local`, never commit)

```bash
NOTION_API_KEY=...
NOTION_DATABASE_ID=...
MOBILE_SYNC_SECRET=...
MOBILE_API_URL=https://api.bhculturecalendar.co.uk   # optional if default is fine
SITE_URL=https://bhculturecalendar.co.uk             # optional origin smoke check
```

Confirm `.env` / `.env*.local` are in `.gitignore`.

### A2. GitHub Actions secrets

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Required | Purpose |
|--------|----------|---------|
| `NOTION_API_KEY` | Yes | Sync + verify |
| `NOTION_DATABASE_ID` | Yes | Sync + verify |
| `MOBILE_SYNC_SECRET` | Yes | Write to API |
| `CLOUDFLARE_PAGES_DEPLOY_HOOK_URL` | Yes | Redeploy site after green verify |
| `MOBILE_API_URL` | No | Override API base |
| `SITE_URL` | No | `https://your-domain` for origin check |

### A3. Cloudflare Pages

1. Pages project connected to this GitHub repo (works with **private** repos if the Cloudflare GitHub app has access).
2. Build: install + `npm run build` (or your existing command).
3. Build env vars:
   - `EVENTS_SOURCE` = `api`
   - `MOBILE_API_URL` = `https://api.bhculturecalendar.co.uk`
4. **Do not** put Notion or sync secrets on Pages.
5. **Settings → Deploy hooks** → create hook (e.g. `after-content-sync`) → copy URL into GitHub secret `CLOUDFLARE_PAGES_DEPLOY_HOOK_URL`.

### A4. Cloudflare API Worker

1. Public `GET /events`, `/events/today`, `/venues` return JSON.
2. `POST /admin/sync-events` requires header `x-sync-secret` matching `MOBILE_SYNC_SECRET`.
3. Finalize + prune behaviour matches the sync script.

### A5. Push code including workflows

Ensure `develop` (or production branch) has:

- `.github/workflows/content-sync.yml`
- `scripts/sync-mobile-api.ts`
- `scripts/verify-content.ts`
- `src/lib/mobile-api.ts`, `location.ts`, `venue-coordinates.json` as needed

---

## Part B — Local verification (before prod)

Run from repo root with `.env.local` loaded by the scripts:

```bash
npm ci

# 1) Write Notion → API
npm run sync-mobile-api

# 2) Automated checks (must exit 0)
npm run verify:content

# Or one shot:
npm run sync:verify

# 3) API-only (no Notion) — app/site read path
npm run verify:api

# 4) Site static build from API (no Notion keys)
EVENTS_SOURCE=api MOBILE_API_URL=https://api.bhculturecalendar.co.uk npm run build
```

### What `verify:content` fails on

| Failure | Meaning | Clients affected |
|---------|---------|------------------|
| API `/events` down or empty | Store not serving catalogue | App + site |
| API `/events/today` or `/venues` broken | Partial API outage | App + site features |
| `MISSING_IN_API` | Notion event not in DB | App + site missing events |
| `STALE_IN_API` | DB has deleted Notion rows | App + site show old events |
| `MISMATCH` title/date/isFree | Sync mapped or stored wrong | Wrong details in both |
| Site data layer fail | Build/read path broken | Site build + app list |
| Site origin (if `SITE_URL` set) | Domain/Pages not responding | Website only |

Exit code **1** → do **not** treat production as healthy; re-sync or fix API.

### Manual spot-check (optional but good once)

1. Change one event title in Notion (unique string).
2. `npm run sync:verify`
3. Confirm PASS and that `curl` shows the title:

```bash
curl -sS "$MOBILE_API_URL/events" | grep -F "your-unique-title"
```

4. After Pages deploy finishes, hard-refresh `/whats-on`.
5. Refresh iOS app.

---

## Part C — Production path (GitHub Action)

Workflow: **Content Sync** (`.github/workflows/content-sync.yml`)

| Step | On failure |
|------|------------|
| `npm run sync-mobile-api` | Job fails — DB not updated from this run |
| `npm run verify:content` | Job fails — **Deploy Hook is not called** (site keeps last good build; investigate API/DB) |
| Deploy Hook `curl` | Job fails — API may already be correct; app OK; site stale until hook works |

Schedule: daily `06:00 UTC` + **workflow_dispatch** (manual).

### First production dry run

1. Secrets configured (Part A2–A3).
2. Push branch with workflow.
3. Actions → **Content Sync** → **Run workflow**.
4. Confirm all steps green.
5. Cloudflare Pages → new deployment (Deploy Hook).
6. Re-run mental checklist: API curl, site, app.

### Daily ops

- Editors change Notion when needed.
- Cron sync + verify + redeploy.
- Urgent: **Run workflow** manually.
- Red Action email/notification = content pipeline broken — check logs for MISSING/STALE/MISMATCH.

---

## Part D — npm scripts reference

| Script | Purpose |
|--------|---------|
| `npm run sync-mobile-api` | Notion → API write |
| `npm run verify:content` | Full automated tests (Notion ↔ API + health) |
| `npm run verify:api` | Public API (+ optional site) only |
| `npm run sync:verify` | Sync then full verify |
| `npm run build` | Static site export |

```bash
npm run verify:content -- --json    # machine-readable report
npm run verify:api -- --json
```

---

## Part E — What is / is not covered

### Covered automatically

- API up and returning event/venue JSON  
- Catalogue non-empty  
- After sync: every Notion event id present in API  
- No stale API ids left after prune  
- title / date / isFree parity for shared ids  
- Site/app read path can load events from API  
- Optional production origin HTTP check  

### Not covered (by design / limits)

- Pixel-perfect static HTML equals API until Pages finishes (async CDN deploy)  
- iOS UI / App Store binary tests  
- Notion permission or schema changes beyond fetch failures  
- Load/perf testing  

**Mitigation for site lag:** verify blocks deploy on bad API; once hook fires, Pages rebuilds from the same API the checks just validated.

---

## Part F — Failure playbook

1. Open failed **Content Sync** run → which step?
2. **Sync failed** → Notion keys, API secret, Worker admin route, network.
3. **Verify failed** → read `MISSING_IN_API` / `STALE_IN_API` / `MISMATCH` lines.
4. Re-run locally: `npm run sync:verify` with `.env.local`.
5. If API correct but site old → check Deploy Hook secret and Pages deploy logs.
6. If API correct but app old → force-quit/refresh app; confirm app base URL is production API.

---

## Checklist (print / ticket)

- [ ] `.env.local` set locally; not in git  
- [ ] GitHub secrets set  
- [ ] Cloudflare Pages env `EVENTS_SOURCE=api`  
- [ ] Deploy Hook secret set  
- [ ] `npm run sync:verify` passes locally  
- [ ] `EVENTS_SOURCE=api npm run build` passes  
- [ ] Manual Content Sync green on GitHub  
- [ ] API + site + app spot-checked after first run  
