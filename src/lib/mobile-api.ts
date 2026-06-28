import type { Event } from "@/lib/notion";
import { getCoordinatesForLocation, getLocationSlugFromPostcode } from "@/lib/location";

export interface MobileEventDTO {
    id: string;
    title: string;
    date: string;
    endDate: string | null;
    category: string[];
    venue: string[];
    postcode: string[];
    location: string;
    latitude: number;
    longitude: number;
    isFree: boolean;
    coverImage: string | null;
    link: string | null;
    slug: string;
}

function slugify(...parts: string[]): string {
    return parts
        .join("-")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

export function toMobileEvent(event: Event): MobileEventDTO {
    const location = getLocationSlugFromPostcode(event.postcode);
    const coordinates = getCoordinatesForLocation(location);

    return {
        id: event.id,
        title: event.title,
        date: event.date,
        endDate: event.endDate,
        category: event.category,
        venue: event.venue,
        postcode: event.postcode,
        location,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        isFree: event.isFree,
        coverImage: event.coverImage,
        link: event.link || null,
        slug: event.id.replace(/-/g, ""),
    };
}

export function toMobileEvents(events: Event[]): MobileEventDTO[] {
    return events.map(toMobileEvent);
}