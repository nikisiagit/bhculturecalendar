import type { Event } from "@/lib/types";

export const SITE_URL = "https://bhculturecalendar.co.uk";

/** URL-safe slug from free text */
export function slugifyText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

/** Stable event path segment (matches mobile API slug when present) */
export function getEventSlug(event: Event): string {
  if (event.slug?.trim()) return event.slug.trim();
  return event.id.replace(/-/g, "") || slugifyText(event.title);
}

export function getCategorySlug(category: string): string {
  return slugifyText(category);
}

export function getVenueSlug(venueName: string): string {
  return slugifyText(venueName);
}

export function eventPath(event: Event): string {
  return `/event/${getEventSlug(event)}`;
}

export function categoryPath(category: string): string {
  return `/whats-on/category/${getCategorySlug(category)}`;
}

export function venuePath(venueName: string): string {
  return `/venues/${getVenueSlug(venueName)}`;
}

export function formatEventDateRange(start: string, end: string | null): string {
  if (!start) return "Date TBC";
  const startDate = new Date(start);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const startStr = startDate.toLocaleDateString("en-GB", options);
  if (end) {
    const endStr = new Date(end).toLocaleDateString("en-GB", options);
    return `${startStr} — ${endStr}`;
  }
  if (start.includes("T")) {
    const timeStr = startDate.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${startStr}, ${timeStr}`;
  }
  return startStr;
}

/** ISO-ish string for schema.org */
export function toSchemaDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function buildEventJsonLd(event: Event) {
  const venueName = event.venue[0] || "BH postcode area";
  const startDate = toSchemaDate(event.date);
  const endDate = toSchemaDate(event.endDate) || startDate;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title.trim(),
    startDate,
    endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: venueName,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.postcode[0] || "Bournemouth",
        addressRegion: "Dorset",
        addressCountry: "GB",
        ...(event.postcode[0] ? { postalCode: event.postcode[0] } : {}),
      },
    },
    ...(event.coverImage ? { image: [event.coverImage] } : {}),
    ...(event.link
      ? {
          offers: {
            "@type": "Offer",
            url: event.link,
            availability: "https://schema.org/InStock",
            priceCurrency: "GBP",
          },
        }
      : {}),
    organizer: {
      "@type": "Organization",
      name: "BH Culture Calendar",
      url: SITE_URL,
    },
    url: `${SITE_URL}${eventPath(event)}`,
    isAccessibleForFree: event.isFree,
    keywords: event.category.join(", "),
  };
}

export function buildItemListJsonLd(events: Event[], listName: string, listUrl: string) {
  const items = events.slice(0, 50).map((event, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${SITE_URL}${eventPath(event)}`,
    name: event.title.trim(),
  }));

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    url: listUrl,
    numberOfItems: events.length,
    itemListElement: items,
  };
}

/** Find event by URL slug */
export function findEventBySlug(events: Event[], slug: string): Event | undefined {
  const decoded = decodeURIComponent(slug).toLowerCase();
  return events.find((e) => getEventSlug(e).toLowerCase() === decoded);
}

export function findEventsByCategory(events: Event[], categorySlug: string): Event[] {
  const decoded = decodeURIComponent(categorySlug).toLowerCase();
  return events.filter((e) =>
    e.category.some((c) => getCategorySlug(c) === decoded)
  );
}

export function findEventsByVenue(events: Event[], venueSlug: string): Event[] {
  const decoded = decodeURIComponent(venueSlug).toLowerCase();
  return events.filter((e) =>
    e.venue.some((v) => getVenueSlug(v) === decoded)
  );
}

export function resolveCategoryLabel(events: Event[], categorySlug: string): string {
  const decoded = decodeURIComponent(categorySlug).toLowerCase();
  for (const e of events) {
    for (const c of e.category) {
      if (getCategorySlug(c) === decoded) return c;
    }
  }
  return categorySlug.replace(/-/g, " ");
}

export function resolveVenueLabel(events: Event[], venueSlug: string): string {
  const decoded = decodeURIComponent(venueSlug).toLowerCase();
  for (const e of events) {
    for (const v of e.venue) {
      if (getVenueSlug(v) === decoded) return v;
    }
  }
  return venueSlug.replace(/-/g, " ");
}
