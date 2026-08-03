# Cloudflare rate limits & abuse protection

Stack: **Notion + GitHub + Cloudflare only**.  
Goal: stop scrapers / bots / leaked-secret spam from running up usage (or burning free quotas).

Apply these in the **Cloudflare dashboard**. Exact UI labels move slightly over time; look under **Security → Security rules / WAF / Rate limiting rules**.

---

## What to protect

| Target | Hostname | Risk |
|--------|----------|------|
| Public API reads | `api.bhculturecalendar.co.uk` | High request volume → Workers/D1 usage |
| Admin sync writes | `…/admin/sync-events` | Secret leak or brute force |
| Content-sync trigger | `bh-content-sync-trigger.nikitavo.workers.dev` | Spam → GitHub Actions runs |
| Static site | `bhculturecalendar.co.uk` / `*.pages.dev` | Usually cheap; optional |

---

## A. Custom domain API (`api.bhculturecalendar.co.uk`)

These rules apply on the **zone** that owns `bhculturecalendar.co.uk` (or wherever the API hostname is proxied 🟠).

### Rule 1 — Rate limit public reads (recommended)

**Type:** Rate limiting rule  
**Name:** `API public read limit`  
**When incoming requests match:**

```txt
(http.host eq "api.bhculturecalendar.co.uk" and http.request.method eq "GET" and not starts_with(http.request.uri.path, "/admin"))
```

**With the same characteristics:**

| Field | Suggested value |
|-------|-----------------|
| Characteristics | IP |
| Period | 1 minute |
| Requests | **120** (tune up if legit traffic is higher) |
| Action | **Block** (or **Managed Challenge** if available) |
| Duration | 1 minute (or 10 minutes) |

**Why 120/min:** A normal app + a few open website tabs polling every ~45s is well under this. Scrapers hammering `/events` will trip it.

**Expression-only variant** (if your UI uses a single expression box for “match”):

```txt
(http.host eq "api.bhculturecalendar.co.uk" and http.request.method in {"GET" "HEAD"} and not starts_with(http.request.uri.path, "/admin"))
```

---

### Rule 2 — Strict limit on admin writes

**Name:** `API admin sync limit`  
**Match:**

```txt
(http.host eq "api.bhculturecalendar.co.uk" and http.request.uri.path eq "/admin/sync-events" and http.request.method eq "POST")
```

| Field | Suggested value |
|-------|-----------------|
| Characteristics | IP |
| Period | 1 minute |
| Requests | **10** |
| Action | **Block** |
| Duration | 10 minutes |

Legitimate Content Sync is a handful of batch POSTs per run (plus finalize). More than ~10/min from one IP is almost never normal.

**Still keep** `x-sync-secret` checks in the Worker — rate limit is extra, not a replacement.

---

### Rule 3 — Optional: challenge obvious bots on API (careful)

Only if scrapers remain a problem. Can interfere with unusual clients.

**Match:**

```txt
(http.host eq "api.bhculturecalendar.co.uk" and http.request.method eq "GET" and cf.client.bot)
```

**Action:** Managed Challenge (if available) or Block.

**Do not** put this on paths your **GitHub Actions** or **iOS app** must hit without a browser. Prefer Rule 1 first.

---

### Rule 4 — Optional: lower ceiling for workers.dev API (if used publicly)

If anything still hits `bh-culture-calendar-api.nikitavo.workers.dev` from the public internet, either:

1. Prefer custom domain only for clients, or  
2. Add a **Worker**-level limit (see §C) — zone WAF often does **not** apply to `*.workers.dev` the same way.

---

## B. Content-sync trigger Worker (`*.workers.dev`)

`bh-content-sync-trigger.nikitavo.workers.dev` usually **cannot** use zone WAF rules for `bhculturecalendar.co.uk`.

Protect it with:

### B1 — Secret (you already have this)

- `POST /trigger` requires `x-trigger-secret` (or `?secret=`)
- Rotate if leaked

### B2 — Optional: put trigger on a custom subdomain (then WAF applies)

Example: `sync-trigger.bhculturecalendar.co.uk` → route to the trigger Worker.

Then rate limit:

```txt
(http.host eq "sync-trigger.bhculturecalendar.co.uk" and http.request.uri.path eq "/trigger" and http.request.method eq "POST")
```

| Period | Requests | Action |
|--------|----------|--------|
| 1 minute | **5** | Block |

Content Sync only needs a few triggers per hour; 5/min/IP is plenty.

### B3 — Without custom domain: Worker Rate Limiting binding

In `workers/content-sync-trigger/wrangler.jsonc` you can add a rate limit binding (Workers feature; free-tier availability can change — check dashboard if deploy fails):

```jsonc
"ratelimits": [
  {
    "name": "TRIGGER_RATE_LIMITER",
    "namespace_id": "1001",
    "simple": {
      "limit": 5,
      "period": 60
    }
  }
]
```

Then in code (conceptually): `env.TRIGGER_RATE_LIMITER.limit({ key: ip })` before dispatch.

If you want this wired in code, ask to implement it in the trigger Worker.

---

## C. Static site (`bhculturecalendar.co.uk` / Pages)

Usually optional. If HTML scraping is noisy:

```txt
(http.host eq "bhculturecalendar.co.uk" and http.request.uri.path contains "/whats-on")
```

| Period | Requests | Action |
|--------|----------|--------|
| 1 minute | **300** | Managed Challenge / Block |

Keep high — real users + assets need headroom. Prefer limiting the **API** over the site.

---

## D. Suggested rule order

1. **Admin sync** — strict (Rule 2)  
2. **API GET rate limit** — main protection (Rule 1)  
3. Trigger secret (+ optional custom host limit)  
4. Site limit only if needed  

---

## E. Dashboard path (current CF UI)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → select zone **bhculturecalendar.co.uk**  
2. **Security** → **Security rules** (or **WAF** → **Rate limiting rules**)  
3. **Create rule** → **Rate limiting**  
4. Paste match expression → set thresholds → **Deploy**  

For **Workers & Pages** product limits (not WAF):

- Account **Notifications** → billing / usage alerts  
- Stay on **Workers Free** until you outgrow it  

---

## F. Verify rules work

```bash
# Should succeed a few times
curl -sS -o /dev/null -w "%{http_code}\n" "https://api.bhculturecalendar.co.uk/events"

# Optional stress (careful): many rapid requests from one IP should start returning 429
for i in $(seq 1 200); do
  curl -sS -o /dev/null -w "%{http_code}\n" "https://api.bhculturecalendar.co.uk/events"
done | sort | uniq -c
```

Admin without secret should already be **401/403** from the Worker regardless of rate limits:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  -X POST "https://api.bhculturecalendar.co.uk/admin/sync-events" \
  -H "content-type: application/json" \
  -d '{}'
```

Trigger without secret:

```bash
curl -sS "https://bh-content-sync-trigger.nikitavo.workers.dev/trigger" \
  -X POST -H "content-type: application/json" -d '{}'
# expect {"ok":false,"error":"Unauthorized"}
```

---

## G. Tuning

| Symptom | Change |
|---------|--------|
| Real users / app get 429 | Raise GET limit (e.g. 120 → 300) |
| Scrapers still cheap | Lower GET limit or add bot challenge |
| Sync job 429s mid-run | Raise admin limit slightly or exclude GitHub if on custom domain + known ranges (fragile) — better: use **workers.dev** for CI sync (you already do) so zone rules on the custom domain don’t hit Actions |

**Important:** Keep **`MOBILE_API_URL` for GitHub Actions** on `*.workers.dev` so zone rate limits on `api.bhculturecalendar.co.uk` do **not** block Content Sync.

---

## H. Checklist

- [ ] Billing / usage email alerts on  
- [ ] Rate limit GET on `api.bhculturecalendar.co.uk` (~120/min/IP)  
- [ ] Rate limit POST `/admin/sync-events` (~10/min/IP)  
- [ ] Trigger still secret-protected  
- [ ] Optional: custom host + rate limit for trigger  
- [ ] CI still uses workers.dev for sync writes  

Related: [near-realtime.md](./near-realtime.md), [setup-and-verification.md](./setup-and-verification.md).
