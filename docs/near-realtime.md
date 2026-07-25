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

## 3. Notion → API within ~1 minute

GitHub Actions **cannot** reliably schedule every 1 minute (minimum practical schedule is **5 minutes**). For **~1 minute**, trigger sync **when Notion changes**.

### A. Trigger Content Sync via `repository_dispatch` (recommended)

**GitHub secret:** create a fine-grained or classic PAT with `repo` scope → store as repo secret `CONTENT_SYNC_DISPATCH_TOKEN` only if you use a relay; for Make/Zapier, put the token in that tool’s vault (not in this repo).

**HTTP call** (from Make, Zapier, n8n, or a tiny Worker):

```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_GITHUB_PAT" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/nikisiagit/bhculturecalendar/dispatches \
  -d '{"event_type":"notion-update"}'
```

`event_type` must be `notion-update` or `content-sync` (see workflow).

**Notion side options:**

1. **Notion Automations** (if available on your plan) → “Send webhook” to Make/Worker  
2. **Make.com / Zapier:** Notion “Database item created/updated” → HTTP module with the curl above  
3. Manual: Actions → Content Sync → Run workflow  

Typical latency: **Notion event → dispatch → runner start → sync** often **30–90 seconds**.

### B. Backup: every 5 minutes

Workflow schedule:

```yaml
cron: "*/5 * * * *"
```

Catches missed webhooks. Worst case without webhook: **5 minutes**.

### C. True 1-minute poll without GitHub (optional later)

Cloudflare **Worker Cron** `* * * * *` that runs the same Notion→API sync logic (or calls a private sync endpoint). Move sync into the API Worker repo if you want that.

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
