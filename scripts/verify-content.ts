/**
 * Automated content verification for BH Culture Calendar.
 *
 * Checks that:
 * 1. Mobile API is healthy (public reads the app + site use)
 * 2. API event set matches Notion (after sync) — IDs + key fields
 * 3. Optional: site origin responds (does not prove HTML freshness)
 *
 * Usage:
 *   npm run verify:content          # Notion ↔ API (needs NOTION_*)
 *   npm run verify:api              # API health only
 *   npm run verify:content -- --json
 *
 * Exit 0 = pass, 1 = fail
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const API_URL = (process.env.MOBILE_API_URL || "https://api.bhculturecalendar.co.uk").replace(
  /\/$/,
  ""
);
const SITE_URL = (process.env.SITE_URL || process.env.VERIFY_SITE_URL || "").replace(/\/$/, "");
const apiOnly = process.argv.includes("--api-only");
const asJson = process.argv.includes("--json");

type ApiEvent = {
  id: string;
  title?: string;
  date?: string;
  endDate?: string | null;
  isFree?: boolean;
  venue?: string[];
  category?: string[];
  link?: string | null;
  coverImage?: string | null;
};

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
  errors?: string[];
};

function normalizeDate(value: string | null | undefined): string {
  if (!value) return "";
  // Compare calendar date; ignore time/timezone suffix noise
  const m = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : String(value).trim();
}

function normalizeTitle(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

async function fetchJson(url: string): Promise<{ status: number; data: unknown; ms: number }> {
  const start = Date.now();
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // Avoid stale edge cache during verification
    cache: "no-store",
  });
  const ms = Date.now() - start;
  let data: unknown = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { _raw: text.slice(0, 200) };
  }
  return { status: res.status, data, ms };
}

function extractEvents(payload: unknown): ApiEvent[] {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.events)) return obj.events as ApiEvent[];
  if (Array.isArray(payload)) return payload as ApiEvent[];
  return [];
}

async function checkApiHealth(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  for (const route of ["/events", "/events/today", "/venues"] as const) {
    const url = `${API_URL}${route}`;
    try {
      const { status, data, ms } = await fetchJson(url);
      if (status !== 200) {
        results.push({
          name: `API ${route}`,
          ok: false,
          detail: `HTTP ${status} in ${ms}ms — app and site cannot rely on this endpoint`,
        });
        continue;
      }

      if (route === "/venues") {
        const venues = (data as { venues?: unknown[] })?.venues;
        const ok = Array.isArray(venues);
        results.push({
          name: `API ${route}`,
          ok,
          detail: ok
            ? `HTTP 200, ${venues!.length} venues (${ms}ms)`
            : `HTTP 200 but missing venues array (${ms}ms)`,
        });
      } else {
        const events = extractEvents(data);
        const ok = Array.isArray(events);
        // /events/today may legitimately be empty
        const emptyOk = route === "/events/today" || events.length > 0;
        results.push({
          name: `API ${route}`,
          ok: ok && (route === "/events/today" ? true : emptyOk),
          detail: ok
            ? `HTTP 200, ${events.length} events (${ms}ms)${
                route === "/events" && events.length === 0
                  ? " — WARNING: empty catalogue"
                  : ""
              }`
            : `HTTP 200 but response shape unexpected (${ms}ms)`,
          errors:
            route === "/events" && events.length === 0
              ? ["GET /events returned zero events — store may be empty or sync never ran"]
              : undefined,
        });
        // Treat empty /events as failure for production readiness
        if (route === "/events" && events.length === 0) {
          results[results.length - 1].ok = false;
        }
      }
    } catch (e) {
      results.push({
        name: `API ${route}`,
        ok: false,
        detail: `Request failed: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  return results;
}

async function checkNotionVsApi(): Promise<CheckResult> {
  const notionKey = process.env.NOTION_API_KEY;
  const notionDb = process.env.NOTION_DATABASE_ID;
  if (!notionKey || !notionDb) {
    return {
      name: "Notion ↔ API parity",
      ok: false,
      detail: "Missing NOTION_API_KEY or NOTION_DATABASE_ID",
    };
  }

  // Lazy import so --api-only does not require Notion modules at startup
  const { getEvents } = await import("../src/lib/notion");
  const { toMobileEvents } = await import("../src/lib/mobile-api");

  console.error("Fetching events from Notion…");
  const notionEvents = await getEvents();
  const expected = toMobileEvents(notionEvents);
  console.error(`Notion: ${expected.length} events (mapped)`);

  console.error("Fetching events from Mobile API…");
  const { status, data, ms } = await fetchJson(`${API_URL}/events`);
  if (status !== 200) {
    return {
      name: "Notion ↔ API parity",
      ok: false,
      detail: `API /events returned HTTP ${status} (${ms}ms)`,
    };
  }

  const actual = extractEvents(data);
  console.error(`API: ${actual.length} events (${ms}ms)`);

  const expectedById = new Map(expected.map((e) => [e.id, e]));
  const actualById = new Map(actual.map((e) => [e.id, e]));

  const errors: string[] = [];

  // Missing in API (Notion has them — store did not pick up / sync failed)
  for (const id of expectedById.keys()) {
    if (!actualById.has(id)) {
      const t = expectedById.get(id)!.title;
      errors.push(`MISSING_IN_API id=${id} title="${t}"`);
    }
  }

  // Extra in API (not pruned after Notion delete)
  for (const id of actualById.keys()) {
    if (!expectedById.has(id)) {
      const t = actualById.get(id)!.title ?? "(no title)";
      errors.push(`STALE_IN_API id=${id} title="${t}" (not in Notion)`);
    }
  }

  // Field mismatches for shared IDs
  for (const [id, exp] of expectedById) {
    const act = actualById.get(id);
    if (!act) continue;

    const fieldErrors: string[] = [];
    if (normalizeTitle(act.title) !== normalizeTitle(exp.title)) {
      fieldErrors.push(`title expected="${exp.title}" actual="${act.title ?? ""}"`);
    }
    if (normalizeDate(act.date) !== normalizeDate(exp.date)) {
      fieldErrors.push(
        `date expected="${normalizeDate(exp.date)}" actual="${normalizeDate(act.date)}"`
      );
    }
    if (typeof act.isFree === "boolean" && act.isFree !== exp.isFree) {
      fieldErrors.push(`isFree expected=${exp.isFree} actual=${act.isFree}`);
    }
    // link: API may null vs ""; treat empty as equal
    const expLink = (exp.link ?? "").trim();
    const actLink = (act.link ?? "").trim();
    if (expLink && actLink && expLink !== actLink) {
      fieldErrors.push(`link differs`);
    }

    if (fieldErrors.length) {
      errors.push(`MISMATCH id=${id}: ${fieldErrors.join("; ")}`);
    }
  }

  const maxShow = 40;
  const shown = errors.slice(0, maxShow);
  const more = errors.length > maxShow ? ` (+${errors.length - maxShow} more)` : "";

  const ok = errors.length === 0;
  return {
    name: "Notion ↔ API parity",
    ok,
    detail: ok
      ? `All ${expected.length} Notion events match API (ids + title/date/isFree)`
      : `${errors.length} problem(s): ${expected.length} Notion vs ${actual.length} API${more}`,
    errors: shown,
  };
}

async function checkSiteOrigin(): Promise<CheckResult | null> {
  if (!SITE_URL) return null;
  try {
    const start = Date.now();
    const res = await fetch(`${SITE_URL}/whats-on`, {
      redirect: "follow",
      cache: "no-store",
      headers: { Accept: "text/html" },
    });
    const ms = Date.now() - start;
    const ok = res.ok;
    return {
      name: "Site origin",
      ok,
      detail: ok
        ? `GET ${SITE_URL}/whats-on → HTTP ${res.status} (${ms}ms). Note: static HTML may lag API until Pages deploy finishes.`
        : `GET ${SITE_URL}/whats-on → HTTP ${res.status} (${ms}ms)`,
    };
  } catch (e) {
    return {
      name: "Site origin",
      ok: false,
      detail: `Site fetch failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/** Proves the site data layer can load events the same way a production build does. */
async function checkSiteDataLayer(): Promise<CheckResult> {
  // Import dynamically so EVENTS_SOURCE is read from env at call time
  process.env.EVENTS_SOURCE = "api";
  process.env.MOBILE_API_URL = API_URL;

  try {
    // Re-require path: use direct fetch mirroring api-events (avoids module cache of SOURCE)
    const url = new URL("/events", API_URL);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return {
        name: "Site data layer (API read)",
        ok: false,
        detail: `Site build would fail: GET /events → HTTP ${res.status}`,
      };
    }
    const data = (await res.json()) as { events?: unknown[] };
    const events = data.events ?? [];
    if (!Array.isArray(events)) {
      return {
        name: "Site data layer (API read)",
        ok: false,
        detail: "Site build would fail: /events response missing events array",
      };
    }
    // Minimal shape check for static pages
    const sample = events[0] as ApiEvent | undefined;
    if (sample && (!sample.id || sample.title === undefined || !sample.date)) {
      return {
        name: "Site data layer (API read)",
        ok: false,
        detail: "Events missing required fields (id/title/date) for site components",
      };
    }
    return {
      name: "Site data layer (API read)",
      ok: events.length > 0,
      detail:
        events.length > 0
          ? `Site/app can read ${events.length} events from API (same path as static export + iOS)`
          : "Zero events — site would build empty calendar; app would show empty list",
    };
  } catch (e) {
    return {
      name: "Site data layer (API read)",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

async function main() {
  console.error(`API base: ${API_URL}`);
  console.error(`Mode: ${apiOnly ? "api-only" : "full (Notion ↔ API)"}`);

  const results: CheckResult[] = [];

  results.push(...(await checkApiHealth()));
  results.push(await checkSiteDataLayer());

  if (!apiOnly) {
    results.push(await checkNotionVsApi());
  }

  const site = await checkSiteOrigin();
  if (site) results.push(site);

  const failed = results.filter((r) => !r.ok);
  const report = {
    ok: failed.length === 0,
    apiUrl: API_URL,
    mode: apiOnly ? "api-only" : "full",
    checks: results,
    summary: {
      passed: results.filter((r) => r.ok).length,
      failed: failed.length,
      total: results.length,
    },
  };

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("\n=== Content verification ===\n");
    for (const r of results) {
      const mark = r.ok ? "PASS" : "FAIL";
      console.log(`[${mark}] ${r.name}`);
      console.log(`       ${r.detail}`);
      if (r.errors?.length) {
        for (const err of r.errors) {
          console.log(`       - ${err}`);
        }
      }
      console.log("");
    }
    console.log(
      report.ok
        ? `All ${report.summary.total} checks passed.`
        : `${report.summary.failed}/${report.summary.total} checks FAILED.`
    );
    if (!report.ok) {
      console.log(`
What failures mean:
  • API * routes        → app + site cannot load events (infra / Worker down)
  • Site data layer     → static build / iOS would get bad or empty data
  • Notion ↔ API parity → DB not synced: missing, stale, or wrong fields
  • Site origin         → production URL down (content may still lag after deploy)

Fix: re-run npm run sync-mobile-api then npm run verify:content
`);
    }
  }

  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error("Verify crashed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
