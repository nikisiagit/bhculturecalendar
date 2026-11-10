import type { Event } from "@/lib/types";

/** End of the event's last calendar day (uses endDate when present). */
export function getEventEndDate(event: Pick<Event, "date" | "endDate">): Date | null {
  const raw = event.endDate || event.date;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  // Date-only values: treat as end of that local day
  if (!raw.includes("T")) {
    d.setHours(23, 59, 59, 999);
  }
  return d;
}

/** True when the event's last day is strictly before the start of today (local). */
export function isEventPast(event: Pick<Event, "date" | "endDate">, now = new Date()): boolean {
  const end = getEventEndDate(event);
  if (!end) return false;
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  return end < todayStart;
}

export function filterUpcomingEvents(events: Event[], now = new Date()): Event[] {
  return events.filter((e) => !isEventPast(e, now));
}

export function filterPastEvents(events: Event[], now = new Date()): Event[] {
  return events.filter((e) => isEventPast(e, now));
}
