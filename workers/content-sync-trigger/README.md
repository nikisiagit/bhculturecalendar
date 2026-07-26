# Content Sync Trigger Worker

**Stack: Notion + GitHub + Cloudflare only** (no Make/Zapier).

Cloudflare cron (and optional HTTP) fires GitHub `repository_dispatch`, which starts the existing **Content Sync** Action:

`Notion change or timer → this Worker → GitHub Actions → Notion→API sync → app/site`

## What it does

| Trigger | Path |
|---------|------|
| Cron `0 */12 * * *` (UTC, every 12 hours) | `scheduled` handler → GitHub dispatch |
| `POST /trigger` + secret | Manual or Notion webhook → same dispatch |
| `GET /health` | Liveness (no secrets) |

Dispatch event type (default): **`notion-update`**  
(must match `.github/workflows/content-sync.yml` → `repository_dispatch.types`)

## Prerequisites

1. GitHub repo has **Content Sync** with `repository_dispatch` types `notion-update` / `content-sync` (already on `main`).
2. A **GitHub PAT** that can create repository dispatches on `nikisiagit/bhculturecalendar`:
   - Fine-grained: repository access → **Contents: Read-only** is not enough for dispatches; use **Administration: Read and write** is overkill — prefer classic PAT with `repo` scope for a private repo, or fine-grained with **Contents: Read and write** (dispatches are accepted with repo access for Actions).
   - Practical: fine-grained PAT → only this repo → **Permissions: Contents = Read and write**, **Metadata = Read** (dispatches work for many accounts with Contents R/W).
   - Or classic: `repo` scope.
3. Cloudflare account (free Workers is enough).

## Deploy

**Important:** deploy from this folder only (`workers/content-sync-trigger`), not the Next.js repo root. Running `wrangler deploy` at the site root makes Wrangler auto-detect Next.js / OpenNext — do not do that.

```bash
# 1) Update git so this folder exists (on main/develop)
git fetch origin
git checkout main
git pull origin main

# 2) Enter the Worker project (not the monorepo root)
cd workers/content-sync-trigger
npm install
npx wrangler login

# 3) Secrets (interactive — do not put values in git)
npx wrangler secret put GITHUB_TOKEN      # paste PAT
npx wrangler secret put TRIGGER_SECRET    # long random string

# 4) Deploy THIS worker only
npx wrangler deploy
```

Note the `*.workers.dev` URL printed after deploy, e.g.:

`https://bh-content-sync-trigger.<subdomain>.workers.dev`

## Test

```bash
# Health
curl -sS https://bh-content-sync-trigger.<subdomain>.workers.dev/health

# Fire Content Sync (use your TRIGGER_SECRET)
curl -sS -X POST https://bh-content-sync-trigger.<subdomain>.workers.dev/trigger \
  -H "x-trigger-secret: YOUR_TRIGGER_SECRET" \
  -H "content-type: application/json" \
  -d '{"reason":"manual-test"}'
```

Then open GitHub → **Actions → Content Sync**. You should see a run with event **`repository_dispatch`**.

Local:

```bash
cp .dev.vars.example .dev.vars   # fill secrets
npm run dev
# Cron simulation: curl http://localhost:8787/__scheduled
```

## Notion → Worker (optional, ~1 minute path)

Notion cannot call GitHub directly; it can call **this Worker**.

1. Create a Notion integration + webhook subscription for your events database (Notion API / dashboard features as available on your plan), **or** use a Notion automation “Send webhook” if offered.
2. Target URL:

   `https://bh-content-sync-trigger.<subdomain>.workers.dev/trigger?secret=YOUR_TRIGGER_SECRET`

   Prefer header `x-trigger-secret` if the tool supports custom headers.

3. On each Notion publish, Worker dispatches GitHub → Content Sync runs.

If webhooks are awkward on free Notion, rely on the **12‑hour cron** only (still only CF + GitHub + Notion).

## Config vars (`wrangler.jsonc`)

| Var | Default | Meaning |
|-----|---------|---------|
| `GITHUB_OWNER` | `nikisiagit` | Repo owner |
| `GITHUB_REPO` | `bhculturecalendar` | Repo name |
| `DISPATCH_EVENT_TYPE` | `notion-update` | Must match workflow |

Change cron in `wrangler.jsonc` → `triggers.crons` (e.g. `*/10 * * * *`).

## Secrets

| Secret | Purpose |
|--------|---------|
| `GITHUB_TOKEN` | PAT for `POST /repos/.../dispatches` |
| `TRIGGER_SECRET` | Auth for `POST /trigger` |

Never commit `.dev.vars` or PATs.

## Security notes

- `/trigger` without the secret → **401**
- Cron does not need the HTTP secret (runs inside CF)
- Rotate PAT if leaked; store only as `wrangler secret`
- Query-string `?secret=` is supported for dumb webhooks but is easier to leak in logs — prefer header when possible

## Related

- Site workflow: `.github/workflows/content-sync.yml`
- Near-realtime design: `docs/near-realtime.md`
- Architecture: `docs/specs/content-sync-architecture.md`
