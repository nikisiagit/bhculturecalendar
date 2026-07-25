# Near real-time: Notion → app & site within ~1 minute

## Goal

| Client | Target |
|--------|--------|
| **Mobile API / DB** | Updated within ~1 minute of a Notion publish |
| **iOS app** | Sees new data on next API fetch (open / pull-to-refresh / ≤1 min if polling) |
| **Website** | Sees new data within ~45s while the tab is open (client polls API) — **no wait for Pages rebuild** |

## Architecture

```
Notion edit
    │
    ├─► (A) Webhook / automation  ──repository_dispatch──► Content Sync  ─┐
    │                                                                      │
    └─► (B) Cron every 5 min (backup)  ──────────────────► Content Sync  ─┤
                                                                           ▼
                                                              Mobile API (DB)
                                                                   │
                                         ┌─────────────────────────┼─────────────────────────┐
                                         ▼                         ▼                         ▼
                                   iOS app (live GET)     Site browser poll (45s)     Pages rebuild (SEO, slower)
```

Static HTML is only a **first paint / SEO** snapshot. The What’s On UI **refetches** `GET /events` from the public API every **45 seconds** and when the tab becomes visible again.

## 1. Site (this repo) — already implemented

- `src/hooks/useLiveEvents.ts` — poll + visibility refresh  
- `src/lib/client-api.ts` — browser fetch to `NEXT_PUBLIC_MOBILE_API_URL` or `https://api.bhculturecalendar.co.uk`  
- `EventsClient` uses live data  

**Cloudflare Pages env (optional):**

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_MOBILE_API_URL` | `https://api.bhculturecalendar.co.uk` |

API already sends `access-control-allow-origin: *`, so browser fetches work.

## 2. App — no store release required if it already hits the API

Ensure the app:

1. Uses production API base URL  
2. Refetches on **foreground** and/or **pull-to-refresh**  
3. Does **not** cache events longer than ~60s for the main list (or invalidates on appear)

Then app latency ≈ **time until Content Sync finishes** + **time until next app fetch**.

## 3. Notion → API (Notion + GitHub + Cloudflare only)

Do **not** introduce Make/Zapier. Use the scaffolded Worker:

**[`workers/content-sync-trigger/`](../workers/content-sync-trigger/)**

| Piece | Role |
|-------|------|
| CF Worker cron `*/15` | Reliable backup dispatch |
| `POST /trigger` + secret | Notion webhook or manual |
| GitHub Content Sync | Actual Notion → API sync + verify |

### Deploy trigger Worker

```bash
cd workers/content-sync-trigger
npm install
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put TRIGGER_SECRET
npx wrangler deploy
```

See that folder’s `README.md` for PAT scopes and Notion webhook URL shape.

### Optional: GitHub schedule

Content Sync still has a schedule as a last-resort safety net. Prefer the **Cloudflare cron** as the reliable timer.

## 4. End-to-end budget (~1 minute)

| Step | Budget |
|------|--------|
| Notion → automation fires | ~5–15s |
| GitHub `repository_dispatch` + runner | ~15–40s |
| Sync 194 mapped events | ~10–30s |
| API updated | **done** |
| App next fetch | 0–60s depending on app |
| Site open tab next poll | ≤45s |

**Total user-visible:** often under **1–2 minutes** if webhook is wired; up to **5 minutes** on cron alone.

## 5. What you should configure now

1. Deploy this site build (live polling).  
2. Keep `MOBILE_API_URL` = workers.dev for CI sync.  
3. Wire **Notion → Make (or similar) → `repository_dispatch`** with `event_type: notion-update`.  
4. Confirm app refreshes on open.  
5. Optional: set `NEXT_PUBLIC_MOBILE_API_URL` on Pages.

## 6. App checklist (for the iOS engineer)

- [ ] Base URL = production API  
- [ ] `viewWillAppear` / scene active → reload events  
- [ ] Pull-to-refresh  
- [ ] Cache TTL ≤ 60s for list endpoint (or no cache)

No Notion keys in the app.
