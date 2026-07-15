import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

function requireEnv(...keys: string[]): Record<string, string> {
    const missing = keys.filter((key) => !process.env[key]?.trim());
    if (missing.length) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}. ` +
                "Set them in GitHub Actions secrets or website/.env.local for local runs.",
        );
    }

    return Object.fromEntries(keys.map((key) => [key, process.env[key]!.trim()]));
}

async function main() {
    const env = requireEnv(
        "NOTION_API_KEY",
        "NOTION_DATABASE_ID",
        "MOBILE_API_URL",
        "MOBILE_SYNC_SECRET",
    );
    const { getEvents } = await import("../src/lib/notion");
    const { toMobileEvents } = await import("../src/lib/mobile-api");
    const apiUrl = env.MOBILE_API_URL;
    const syncSecret = env.MOBILE_SYNC_SECRET;

    const events = await getEvents();
    const mobileEvents = toMobileEvents(events);
    const allIds = mobileEvents.map((event) => event.id);
    const batchSize = 100;
    let totalInserted = 0;
    const headers: Record<string, string> = {
        "content-type": "application/json",
        "x-sync-secret": syncSecret,
    };
    if (process.env.MOBILE_API_HOST) {
        headers.host = process.env.MOBILE_API_HOST;
    }

    const syncUrl = `${apiUrl.replace(/\/$/, "")}/admin/sync-events`;

    for (let index = 0; index < mobileEvents.length; index += batchSize) {
        const batch = mobileEvents.slice(index, index + batchSize);
        const response = await fetch(syncUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({ events: batch }),
        });

        const body = await response.text();
        if (!response.ok) {
            if (body.includes("Just a moment") || body.includes("cf-chl")) {
                throw new Error(
                    `Sync failed (${response.status}) at batch ${index / batchSize + 1}: ` +
                        "Cloudflare bot protection blocked this request (challenge page). " +
                        "Add a WAF skip rule for POST /admin/sync-events, or set MOBILE_API_URL " +
                        "to your *.workers.dev URL for CI.",
                );
            }
            throw new Error(
                `Sync failed (${response.status}) at batch ${index / batchSize + 1}: ${body.slice(0, 500)}`,
            );
        }

        const result = JSON.parse(body) as { inserted?: string[] };
        totalInserted += result.inserted?.length ?? 0;
        console.log(`Batch ${index / batchSize + 1}: synced ${batch.length} events`);
    }

    const finalizeResponse = await fetch(syncUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ events: [], finalize: true, allIds }),
    });
    const finalizeBody = await finalizeResponse.text();
    if (!finalizeResponse.ok) {
        if (finalizeBody.includes("Just a moment") || finalizeBody.includes("cf-chl")) {
            throw new Error(
                `Finalize failed (${finalizeResponse.status}): Cloudflare bot protection blocked this request.`,
            );
        }
        throw new Error(`Finalize failed (${finalizeResponse.status}): ${finalizeBody.slice(0, 500)}`);
    }

    const finalizeResult = JSON.parse(finalizeBody) as { pruned?: number };
    console.log(`Finalized sync. Pruned ${finalizeResult.pruned ?? 0} stale events.`);

    console.log(
        `Synced ${mobileEvents.length} events to mobile API. New events: ${totalInserted}`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});