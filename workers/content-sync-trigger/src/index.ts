/**
 * Content Sync trigger Worker
 *
 * Stack: Notion + GitHub + Cloudflare only (no Make/Zapier).
 *
 * - Cron (every 15 min): repository_dispatch → GitHub Actions "Content Sync"
 * - POST /trigger with x-trigger-secret: same (for Notion webhooks or manual curl)
 * - GET /health: public liveness (no secrets)
 *
 * Secrets (wrangler secret put):
 *   GITHUB_TOKEN   — PAT that can create repository_dispatch on the repo
 *   TRIGGER_SECRET — shared secret for HTTP trigger
 */

export interface Env {
  GITHUB_TOKEN: string;
  TRIGGER_SECRET: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  DISPATCH_EVENT_TYPE: string;
}

interface DispatchResult {
  ok: boolean;
  status: number;
  detail: string;
}

async function dispatchContentSync(env: Env, reason: string): Promise<DispatchResult> {
  if (!env.GITHUB_TOKEN?.trim()) {
    return { ok: false, status: 500, detail: "Missing secret GITHUB_TOKEN" };
  }

  const owner = env.GITHUB_OWNER || "nikisiagit";
  const repo = env.GITHUB_REPO || "bhculturecalendar";
  const eventType = env.DISPATCH_EVENT_TYPE || "notion-update";

  const url = `https://api.github.com/repos/${owner}/${repo}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "bh-content-sync-trigger",
    },
    body: JSON.stringify({
      event_type: eventType,
      client_payload: {
        reason,
        source: "cloudflare-worker",
        at: new Date().toISOString(),
      },
    }),
  });

  // GitHub returns 204 No Content on success
  if (res.status === 204) {
    return {
      ok: true,
      status: 204,
      detail: `Dispatched ${eventType} to ${owner}/${repo} (${reason})`,
    };
  }

  const body = await res.text();
  return {
    ok: false,
    status: res.status,
    detail: `GitHub dispatch failed (${res.status}): ${body.slice(0, 400)}`,
  };
}

function unauthorized(): Response {
  return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

function isAuthorized(request: Request, env: Env): boolean {
  const secret = env.TRIGGER_SECRET?.trim();
  if (!secret) return false;

  const header = request.headers.get("x-trigger-secret") || "";
  if (header && timingSafeEqual(header, secret)) return true;

  // Optional: ?secret= for simple Notion webhook tools that cannot set headers
  const url = new URL(request.url);
  const q = url.searchParams.get("secret") || "";
  if (q && timingSafeEqual(q, secret)) return true;

  // Optional: Authorization: Bearer <TRIGGER_SECRET>
  const auth = request.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token && timingSafeEqual(token, secret)) return true;
  }

  return false;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return Response.json({
        ok: true,
        service: "bh-content-sync-trigger",
        endpoints: {
          health: "GET /health",
          trigger: "POST /trigger (header x-trigger-secret)",
        },
        cron: "every 15 min * * * * (UTC)",
        dispatchEvent: env.DISPATCH_EVENT_TYPE || "notion-update",
      });
    }

    if (request.method === "POST" && url.pathname === "/trigger") {
      if (!isAuthorized(request, env)) {
        return unauthorized();
      }

      let reason = "http";
      try {
        const ct = request.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const body = (await request.json()) as { reason?: string };
          if (body?.reason) reason = String(body.reason).slice(0, 120);
        }
      } catch {
        // empty body is fine
      }

      const result = await dispatchContentSync(env, reason);
      return Response.json(
        { ok: result.ok, detail: result.detail },
        { status: result.ok ? 200 : result.status >= 400 ? result.status : 502 }
      );
    }

    return Response.json({ ok: false, error: "Not found" }, { status: 404 });
  },

  async scheduled(controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    const result = await dispatchContentSync(env, `cron:${controller.cron}`);
    if (!result.ok) {
      console.error(result.detail);
      throw new Error(result.detail);
    }
    console.log(result.detail);
  },
} satisfies ExportedHandler<Env>;
