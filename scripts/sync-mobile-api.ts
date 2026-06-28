import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
    const { getEvents } = await import("../src/lib/notion");
    const { toMobileEvents } = await import("../src/lib/mobile-api");
    const apiUrl = process.env.MOBILE_API_URL;
    const syncSecret = process.env.MOBILE_SYNC_SECRET;

    if (!apiUrl || !syncSecret) {
        throw new Error("MOBILE_API_URL and MOBILE_SYNC_SECRET must be set.");
    }

    const events = await getEvents();
    const mobileEvents = toMobileEvents(events);
    const batchSize = 100;
    let totalInserted = 0;

    for (let index = 0; index < mobileEvents.length; index += batchSize) {
        const batch = mobileEvents.slice(index, index + batchSize);
        const headers: Record<string, string> = {
            "content-type": "application/json",
            "x-sync-secret": syncSecret,
        };
        if (process.env.MOBILE_API_HOST) {
            headers.host = process.env.MOBILE_API_HOST;
        }

        const response = await fetch(`${apiUrl.replace(/\/$/, "")}/admin/sync-events`, {
            method: "POST",
            headers,
            body: JSON.stringify({ events: batch }),
        });

        const body = await response.text();
        if (!response.ok) {
            throw new Error(`Sync failed (${response.status}) at batch ${index / batchSize + 1}: ${body}`);
        }

        const result = JSON.parse(body) as { inserted?: string[] };
        totalInserted += result.inserted?.length ?? 0;
        console.log(`Batch ${index / batchSize + 1}: synced ${batch.length} events`);
    }

    console.log(
        `Synced ${mobileEvents.length} events to mobile API. New events: ${totalInserted}`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});