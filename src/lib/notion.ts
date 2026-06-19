import { Client } from "@notionhq/client";
import imageMapData from "@/data/image-map.json";

const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

const imageMap = imageMapData as Record<string, string>;

export interface Event {
    id: string;
    title: string;
    date: string;
    endDate: string | null;
    venue: string[];
    category: string[];
    postcode: string[];
    link: string;
    isFree: boolean;
    coverImage: string | null;
}

let cachedEvents: Event[] | null = null;
let eventsFetchPromise: Promise<Event[]> | null = null;

export const getEvents = async (): Promise<Event[]> => {
    if (cachedEvents) return cachedEvents;
    if (eventsFetchPromise) return eventsFetchPromise;

    eventsFetchPromise = (async () => {
        const dataSourceId = process.env.NOTION_DATABASE_ID;

    if (!dataSourceId) {
        console.warn("NOTION_DATABASE_ID is not defined.");
        return [];
    }

    try {
        let allResults: any[] = [];
        let hasMore = true;
        let startCursor: string | undefined = undefined;

        // Paginate through all results
        while (hasMore) {
            const response: any = await notion.dataSources.query({
                data_source_id: dataSourceId,
                page_size: 100,
                start_cursor: startCursor,
                sorts: [
                    {
                        property: "Date(s) and time",
                        direction: "descending"
                    }
                ]
            });

            allResults = allResults.concat(response.results);
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        console.log(`Fetched ${allResults.length} events from Notion`);

        const finalEvents = allResults.map((page: any) => {
            const props = page.properties;

            // Event Name (title)
            const title = props["Event Name"]?.title?.map((t: any) => t.plain_text).join("") || "Untitled Event";

            // Date(s) and time
            const dateObj = props["Date(s) and time"]?.date;
            const date = dateObj?.start || "";
            const endDate = dateObj?.end || null;

            // Venue (multi_select)
            const venue = props["Venue"]?.multi_select?.map((v: any) => v.name) || [];

            // Category (multi_select)
            const category = props["Category"]?.multi_select?.map((c: any) => c.name) || [];

            // Postcode area (multi_select)
            const postcode = props["Postcode area"]?.multi_select?.map((p: any) => p.name) || [];

            // Link
            let link = props["Link"]?.url || "";
            if (link) {
                try {
                    const urlObj = new URL(link);
                    if (!urlObj.searchParams.has('utm_source')) {
                        urlObj.searchParams.set('utm_source', 'bhculturecalendar');
                    }
                    if (!urlObj.searchParams.has('utm_medium')) {
                        urlObj.searchParams.set('utm_medium', 'referral');
                    }
                    link = urlObj.toString();
                } catch (e) {
                    // Ignore invalid URLs
                }
            }

            // Free (checkbox)
            const isFree = props["Free"]?.checkbox || false;

            // Cover image from page
            let coverImage: string | null = null;
            if (page.cover) {
                if (imageMap[page.id]) {
                    coverImage = imageMap[page.id];
                } else if (page.cover.type === "external") {
                    coverImage = page.cover.external.url;
                } else if (page.cover.type === "file") {
                    coverImage = page.cover.file.url;
                }
            }

            return {
                id: page.id,
                title,
                date,
                endDate,
                venue,
                category,
                postcode,
                link,
                isFree,
                coverImage,
            };
        }).filter(event => {
            if (!event.date) {
                return false;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const eventDate = new Date(event.date);
            // If there's an end date, use that for the check, otherwise use the start date
            const relevantDate = event.endDate ? new Date(event.endDate) : eventDate;
            const isFuture = relevantDate >= today;

            return isFuture;
        }).sort((a, b) => {
            // Helper to determine if event is multi-day (range)
            // User requested to prioritize specific dates over long ranges (exhibitions)
            const isRange = (ev: Event) => {
                if (!ev.endDate) return false;
                const start = new Date(ev.date);
                const end = new Date(ev.endDate);
                return start.toDateString() !== end.toDateString();
            };

            const rangeA = isRange(a);
            const rangeB = isRange(b);

            // 1. Group by Range (Single Day first, Range last)
            if (rangeA !== rangeB) {
                return (rangeA ? 1 : 0) - (rangeB ? 1 : 0);
            }

            // 2. Sort by Date Ascending
            // Use original start date sorting since we are grouping by type
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();

            if (dateA !== dateB) {
                return dateA - dateB;
            }

            // 3. Secondary sort by title
            return a.title.localeCompare(b.title);
        });

        cachedEvents = finalEvents;
        return finalEvents;
    } catch (error) {
        console.error("Error fetching Notion data:", error);
        eventsFetchPromise = null;
        throw error; // Fail the build if data fetching errors
    }
    })();

    return eventsFetchPromise;
};

// Venues
export interface Venue {
    id: string;
    name: string;
    categories: string[];
    link: string;
}

// Venues data source ID
const VENUES_DATA_SOURCE_ID = "299f9c42-88ed-8197-8cf5-000b01220c73";

let cachedVenues: Venue[] | null = null;
let venuesFetchPromise: Promise<Venue[]> | null = null;

export const getVenues = async (): Promise<Venue[]> => {
    if (cachedVenues) return cachedVenues;
    if (venuesFetchPromise) return venuesFetchPromise;

    venuesFetchPromise = (async () => {
    try {
        let allResults: any[] = [];
        let hasMore = true;
        let startCursor: string | undefined = undefined;

        // Paginate through all results
        while (hasMore) {
            const response: any = await notion.dataSources.query({
                data_source_id: VENUES_DATA_SOURCE_ID,
                page_size: 100,
                start_cursor: startCursor,
            });

            allResults = allResults.concat(response.results);
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        console.log(`Fetched ${allResults.length} venues from Notion`);

        const finalVenues = allResults.map((page: any) => {
            const props = page.properties;

            // Venue name (title)
            const name = props["Venue/Event/Site "]?.title?.map((t: any) => t.plain_text).join("") ||
                props["Venue/Event/Site"]?.title?.map((t: any) => t.plain_text).join("") ||
                "Untitled Venue";

            // Categories (multi_select)
            const categories = props["Category/ies"]?.multi_select?.map((c: any) => c.name) || [];

            // Link
            let link = props["Link"]?.url || "";
            if (link) {
                try {
                    const urlObj = new URL(link);
                    if (!urlObj.searchParams.has('utm_source')) {
                        urlObj.searchParams.set('utm_source', 'bhculturecalendar');
                    }
                    if (!urlObj.searchParams.has('utm_medium')) {
                        urlObj.searchParams.set('utm_medium', 'referral');
                    }
                    link = urlObj.toString();
                } catch (e) {
                    // Ignore invalid URLs
                }
            }

            return {
                id: page.id,
                name,
                categories,
                link,
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
        
        cachedVenues = finalVenues;
        return finalVenues;
    } catch (error) {
        console.error("Error fetching venues:", error);
        venuesFetchPromise = null;
        return [];
    }
    })();

    return venuesFetchPromise;
};
