import { Event, Venue } from "./types";
import { getEvents as getNotionEvents, getVenues as getNotionVenues } from "./notion";

const API = process.env.MOBILE_API_URL || "https://api.bhculturecalendar.co.uk";
const SOURCE = process.env.EVENTS_SOURCE || "api";

export async function fetchEvents(searchParams?: URLSearchParams): Promise<Event[]> {
    if (SOURCE === "notion") {
        return getNotionEvents();
    }

    const url = new URL("/events", API);
    if (searchParams) {
        searchParams.forEach((v, k) => url.searchParams.set(k, v));
    }
    
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`API /events ${res.status}`);
    const data = await res.json();
    
    // Convert dates back to string if needed, or assume they match the Event interface.
    return data.events as Event[];
}

export async function fetchTodayEvents(): Promise<Event[]> {
    if (SOURCE === "notion") {
        const all = await getNotionEvents();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return all.filter(e => {
            const date = new Date(e.date);
            date.setHours(0, 0, 0, 0);
            return date.getTime() === today.getTime();
        });
    }

    const url = new URL("/events/today", API);
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`API /events/today ${res.status}`);
    const data = await res.json();
    return data.events as Event[];
}

export async function fetchVenues(): Promise<Venue[]> {
    if (SOURCE === "notion") {
        return getNotionVenues();
    }

    const url = new URL("/venues", API);
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`API /venues ${res.status}`);
    const data = await res.json();

    // API venues have shape { name, location, latitude, longitude, eventCount }
    // Map to the UI Venue type { id, name, categories, link }
    return (data.venues ?? []).map((v: any, i: number) => ({
        id: v.name.toLowerCase().replace(/\s+/g, "-") + "-" + i,
        name: v.name,
        categories: [] as string[],
        link: "",
    }));
}
