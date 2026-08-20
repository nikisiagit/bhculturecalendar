import { normalizeEvent, type Event } from "@/lib/types";

/** Public API base for browser fetches (must allow CORS — production Worker sends *). */
export const PUBLIC_MOBILE_API_URL = (
  process.env.NEXT_PUBLIC_MOBILE_API_URL ||
  process.env.MOBILE_API_URL ||
  "https://api.bhculturecalendar.co.uk"
).replace(/\/$/, "");

/**
 * Fetch events in the browser. Used for near-real-time updates after Notion sync
 * without waiting for a static Pages rebuild.
 */
export async function fetchEventsClient(): Promise<Event[]> {
  const url = `${PUBLIC_MOBILE_API_URL}/events`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API /events ${res.status}`);
  }
  const data = (await res.json()) as { events?: Partial<Event>[] };
  return (data.events ?? []).map(normalizeEvent);
}
