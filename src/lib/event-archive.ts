import type { Event } from "@/lib/types";
import { getEventSlug, getVenueSlug, venuePath } from "@/lib/seo";
import archiveData from "@/data/event-archive.json";

export interface ArchivedEventMeta {
  id: string;
  slug: string;
  title: string;
  venue: string[];
  venueSlug: string | null;
  category: string[];
  date: string;
  endDate: string | null;
  updatedAt: string;
}

export type EventArchiveMap = Record<string, ArchivedEventMeta>;

export function loadEventArchive(): EventArchiveMap {
  return { ...(archiveData as EventArchiveMap) };
}

export function eventToArchiveMeta(event: Event, updatedAt = new Date().toISOString()): ArchivedEventMeta {
  const venue = event.venue?.[0];
  return {
    id: event.id,
    slug: getEventSlug(event),
    title: event.title.trim(),
    venue: event.venue ?? [],
    venueSlug: venue ? getVenueSlug(venue) : null,
    category: event.category ?? [],
    date: event.date,
    endDate: event.endDate,
    updatedAt,
  };
}

/** Merge live events into the archive map (live wins on conflict). */
export function mergeEventsIntoArchive(
  archive: EventArchiveMap,
  events: Event[],
  updatedAt = new Date().toISOString()
): EventArchiveMap {
  const next = { ...archive };
  for (const event of events) {
    if (!event.id) continue;
    next[event.id] = eventToArchiveMeta(event, updatedAt);
    // Also index by compact id / slug for lookup of legacy URLs
    const slug = getEventSlug(event);
    if (slug && slug !== event.id) {
      next[slug] = next[event.id];
    }
  }
  return next;
}

export function findArchiveEntry(
  archive: EventArchiveMap,
  slugOrId: string
): ArchivedEventMeta | undefined {
  const key = decodeURIComponent(slugOrId).toLowerCase();
  if (archive[key]) return archive[key];
  const compact = key.replace(/-/g, "");
  if (archive[compact]) return archive[compact];
  return Object.values(archive).find(
    (e) =>
      e.id.toLowerCase() === key ||
      e.id.replace(/-/g, "").toLowerCase() === compact ||
      e.slug.toLowerCase() === key
  );
}

export function archiveRedirectTarget(entry: ArchivedEventMeta): string {
  if (entry.venueSlug) return venuePath(entry.venue[0] || entry.venueSlug);
  if (entry.venue[0]) return venuePath(entry.venue[0]);
  return "/whats-on";
}
