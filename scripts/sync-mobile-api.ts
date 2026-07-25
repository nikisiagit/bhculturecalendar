import { getEvents } from '../src/lib/notion';
import { toMobileEvents } from '../src/lib/mobile-api';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 1. Load env from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const API_URL = process.env.MOBILE_API_URL || 'https://api.bhculturecalendar.co.uk';
const SYNC_SECRET = process.env.MOBILE_SYNC_SECRET || process.env.SYNC_SECRET;
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function sync() {
    // Validate Environment
    if (!SYNC_SECRET) throw new Error("Missing MOBILE_SYNC_SECRET in .env.local");
    if (!NOTION_API_KEY) throw new Error("Missing NOTION_API_KEY in .env.local");
    if (!NOTION_DATABASE_ID) throw new Error("Missing NOTION_DATABASE_ID in .env.local");

    console.log("Fetching events from Notion...");
    // 2. Fetch events from Notion
    const notionEvents = await getEvents();
    console.log(`Fetched ${notionEvents.length} events from Notion.`);
    
    // 3. Map via toMobileEvents()
    const mobileEvents = toMobileEvents(notionEvents);
    console.log(`Mapped ${mobileEvents.length} events for mobile API.`);
    
    // 4. Batch POST {MOBILE_API_URL}/admin/sync-events with x-sync-secret + JSON events
    const BATCH_SIZE = 50;
    let insertedTotal = 0;
    
    for (let i = 0; i < mobileEvents.length; i += BATCH_SIZE) {
        const batch = mobileEvents.slice(i, i + BATCH_SIZE);
        console.log(`Sending batch ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} events)...`);
        
        const response = await fetch(`${API_URL}/admin/sync-events`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-sync-secret": SYNC_SECRET
            },
            body: JSON.stringify({
                events: batch
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Batch sync failed with status ${response.status}: ${err}`);
        }
        
        const data = await response.json();
        insertedTotal += data.inserted?.length || 0;
    }
    
    // 5. Finalize with empty batch + finalize: true + allIds to prune stale rows
    console.log("Sending finalize request...");
    const finalizeResponse = await fetch(`${API_URL}/admin/sync-events`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-sync-secret": SYNC_SECRET
        },
        body: JSON.stringify({
            events: [],
            finalize: true,
            allIds: mobileEvents.map(e => e.id)
        })
    });

    if (!finalizeResponse.ok) {
        const err = await finalizeResponse.text();
        throw new Error(`Finalize failed with status ${finalizeResponse.status}: ${err}`);
    }

    const finalData = await finalizeResponse.json();
    console.log(`Synced ${insertedTotal} events successfully. Pruned ${finalData.pruned || 0} stale rows.`);
}

sync().catch(err => {
    console.error("Sync error:", err.message);
    process.exit(1);
});
