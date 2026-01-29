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

export const getEvents = async (): Promise<Event[]> => {
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
            });

            allResults = allResults.concat(response.results);
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        console.log(`Fetched ${allResults.length} events from Notion`);

        return allResults.map((page: any) => {
            const props = page.properties;

            // Event Name (title)
            const title = props["Event Name"]?.title?.[0]?.plain_text || "Untitled Event";

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
            const link = props["Link"]?.url || "";

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
            if (!event.date) return false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const eventDate = new Date(event.date);
            // If there's an end date, use that for the check, otherwise use the start date
            const relevantDate = event.endDate ? new Date(event.endDate) : eventDate;

            return relevantDate >= today;
        }).sort((a, b) => {
            // Sort by date ascending (earliest first)
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();

            if (dateA !== dateB) {
                return dateA - dateB;
            }

            // Secondary sort by title for consistent ordering of same-time events
            return a.title.localeCompare(b.title);
        });
    } catch (error) {
        console.error("Error fetching Notion data:", error);
        throw error; // Fail the build if data fetching errors
    }
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

export const getVenues = async (): Promise<Venue[]> => {
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

        return allResults.map((page: any) => {
            const props = page.properties;

            // Venue name (title)
            const name = props["Venue/Event/Site "]?.title?.[0]?.plain_text ||
                props["Venue/Event/Site"]?.title?.[0]?.plain_text ||
                "Untitled Venue";

            // Categories (multi_select)
            const categories = props["Category/ies"]?.multi_select?.map((c: any) => c.name) || [];

            // Link
            const link = props["Link"]?.url || "";

            return {
                id: page.id,
                name,
                categories,
                link,
            };
        }).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error fetching venues:", error);
        return [];
    }
};
