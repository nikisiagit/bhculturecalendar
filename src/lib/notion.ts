import { Client } from "@notionhq/client";
import imageMapData from "@/data/image-map.json";
import { isEventStillActive } from "./event-time";
import { Event, Venue } from "./types";
export type { Event, Venue };

function getNotionClient(): Client {
    const auth = process.env.NOTION_API_KEY;
    if (!auth) {
        throw new Error("NOTION_API_KEY is not defined.");
    }
    return new Client({ auth });
}

/**
 * Notion API v5 queries data sources, not databases.
 * NOTION_DATABASE_ID may be either a database id or a data_source id.
 */
async function resolveEventsDataSourceId(rawId: string): Promise<string> {
    const notion = getNotionClient();
    // Prefer data_source lookup first — NOTION_DATABASE_ID is often already a
    // data_source id; databases.retrieve then only logs a noisy object_not_found.
    try {
        const dataSource = await notion.dataSources.retrieve({ data_source_id: rawId });
        return dataSource.id;
    } catch {
        // Fall through: rawId may be a database id
    }
    const database = await notion.databases.retrieve({ database_id: rawId });
    const sources = (
        database as { data_sources?: Array<{ id: string }> }
    ).data_sources;
    if (sources?.[0]?.id) return sources[0].id;
    throw new Error(
        `Notion database ${rawId} has no data_sources — share it with the integration or set NOTION_DATABASE_ID to the data source id.`
    );
}

const imageMap = imageMapData as Record<string, string>;

let cachedAllDatedEvents: Event[] | null = null;
let allDatedEventsPromise: Promise<Event[]> | null = null;

function sortEventsForListing(events: Event[]): Event[] {
    return [...events].sort((a, b) => {
        // Prefer specific dates over long ranges (exhibitions)
        const isRange = (ev: Event) => {
            if (!ev.endDate) return false;
            const start = new Date(ev.date);
            const end = new Date(ev.endDate);
            return start.toDateString() !== end.toDateString();
        };

        const rangeA = isRange(a);
        const rangeB = isRange(b);
        if (rangeA !== rangeB) {
            return (rangeA ? 1 : 0) - (rangeB ? 1 : 0);
        }

        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) {
            return dateA - dateB;
        }

        return a.title.localeCompare(b.title);
    });
}

/** All Notion rows with a date (includes finished events — for SEO archive redirects). */
export const getAllDatedEvents = async (): Promise<Event[]> => {
    if (cachedAllDatedEvents) return cachedAllDatedEvents;
    if (allDatedEventsPromise) return allDatedEventsPromise;

    allDatedEventsPromise = (async () => {
        const rawId = process.env.NOTION_DATABASE_ID;

        if (!rawId) {
            console.warn("NOTION_DATABASE_ID is not defined.");
            return [];
        }

        try {
            const dataSourceId = await resolveEventsDataSourceId(rawId);
            let allResults: any[] = [];
            let hasMore = true;
            let startCursor: string | undefined = undefined;

            while (hasMore) {
                const response: any = await getNotionClient().dataSources.query({
                    data_source_id: dataSourceId,
                    page_size: 100,
                    start_cursor: startCursor,
                    sorts: [
                        {
                            property: "Date(s) and time",
                            direction: "descending",
                        },
                    ],
                });

                allResults = allResults.concat(response.results);
                hasMore = response.has_more;
                startCursor = response.next_cursor;
            }

            console.error(`Fetched ${allResults.length} events from Notion`);

            const dated = allResults
                .map((page: any) => {
                    const props = page.properties;

                    const title =
                        props["Event Name"]?.title?.map((t: any) => t.plain_text).join("") ||
                        "Untitled Event";

                    const dateObj = props["Date(s) and time"]?.date;
                    const date = dateObj?.start || "";
                    const endDate = dateObj?.end || null;

                    const venue = props["Venue"]?.multi_select?.map((v: any) => v.name) || [];
                    const category =
                        props["Category"]?.multi_select?.map((c: any) => c.name) || [];
                    const postcode =
                        props["Postcode area"]?.multi_select?.map((p: any) => p.name) || [];

                    let link = props["Link"]?.url || "";
                    if (link) {
                        try {
                            const urlObj = new URL(link);
                            if (!urlObj.searchParams.has("utm_source")) {
                                urlObj.searchParams.set("utm_source", "bhculturecalendar");
                            }
                            if (!urlObj.searchParams.has("utm_medium")) {
                                urlObj.searchParams.set("utm_medium", "referral");
                            }
                            link = urlObj.toString();
                        } catch {
                            // Ignore invalid URLs
                        }
                    }

                    const isFree = props["Free"]?.checkbox || false;
                    const isSpotlight =
                        props["Spotlight event"]?.checkbox ||
                        props["Spotlight Event"]?.checkbox ||
                        false;

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
                        isSpotlight,
                        coverImage,
                    };
                })
                .filter((event: Event) => Boolean(event.date));

            cachedAllDatedEvents = sortEventsForListing(dated);
            return cachedAllDatedEvents;
        } catch (error) {
            console.error("Error fetching Notion data:", error);
            allDatedEventsPromise = null;
            throw error;
        }
    })();

    return allDatedEventsPromise;
};

/**
 * Today + future only — same rule as API GET /events (isEventStillActive).
 * Pass `{ includePast: true }` for SEO archive / redirect mapping.
 */
export const getEvents = async (
    options?: { includePast?: boolean },
): Promise<Event[]> => {
    const all = await getAllDatedEvents();
    if (options?.includePast) return all;
    return sortEventsForListing(all.filter((event) => isEventStillActive(event)));
};

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
            const response: any = await getNotionClient().dataSources.query({
                data_source_id: VENUES_DATA_SOURCE_ID,
                page_size: 100,
                start_cursor: startCursor,
            });

            allResults = allResults.concat(response.results);
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        console.error(`Fetched ${allResults.length} venues from Notion`);

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
