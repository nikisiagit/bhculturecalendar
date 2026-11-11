import type { Event } from "@/lib/types";

/** Calendar day in UTC (YYYY-MM-DD) — matches bhculturecalendar-api `todayISO()`. */
export function todayISO(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * True when the event is still on or after today (UTC calendar day).
 * Same rule as bhculturecalendar-api `isEventStillActive` / GET /events default filter:
 * `(endDate ?? date).slice(0, 10) >= today`.
 */
export function isEventStillActive(
  event: Pick<Event, "date" | "endDate">,
  today = todayISO()
): boolean {
  const raw = event.endDate || event.date;
  if (!raw) return false;
  return raw.slice(0, 10) >= today;
}

/** End of the event's last calendar day (uses endDate when present). */
export function getEventEndDate(event: Pick<Event, "date" | "endDate">): Date | null {
  const raw = event.endDate || event.date;
  if (!raw) return null;
  const d = new Date(raw.includes("T") ? raw : `${raw}T23:59:59.999Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/** True when the event's last calendar day is before today (UTC). */
export function isEventPast(
  event: Pick<Event, "date" | "endDate">,
  now = new Date()
): boolean {
  return !isEventStillActive(event, todayISO(now));
}

export function filterUpcomingEvents(events: Event[], now = new Date()): Event[] {
  const today = todayISO(now);
  return events.filter((e) => isEventStillActive(e, today));
}

export function filterPastEvents(events: Event[], now = new Date()): Event[] {
  const today = todayISO(now);
  return events.filter((e) => !isEventStillActive(e, today));
}
