import dotenv from "dotenv";
import path from "path";
import { getEvents } from "../src/lib/notion";
import { toMobileEvents } from "../src/lib/mobile-api";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
    const apiUrl = process.env.MOBILE_API_URL;
    const syncSecret = process.env.MOBILE_SYNC_SECRET;

    if (!apiUrl || !syncSecret) {
        throw new Error("MOBILE_API_URL and MOBILE_SYNC_SECRET must be set.");
    }

    const events = await getEvents();
    const payload = { events: toMobileEvents(events) };

    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/admin/sync-events`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-sync-secret": syncSecret,
        },
        body: JSON.stringify(payload),
    });

    const body = await response.text();
    if (!response.ok) {
        throw new Error(`Sync failed (${response.status}): ${body}`);
    }

    const result = JSON.parse(body) as { inserted?: string[] };
    console.log(
        `Synced ${payload.events.length} events to mobile API. New events: ${result.inserted?.length ?? 0}`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});