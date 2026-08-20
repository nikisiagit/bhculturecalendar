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
    isSpotlight: boolean;
    coverImage: string | null;
    /** Optional URL slug from Mobile API */
    slug?: string | null;
}

/** Fill missing API fields so older payloads still render. */
export function normalizeEvent(raw: Partial<Event>): Event {
    return {
        id: raw.id ?? "",
        title: raw.title ?? "",
        date: raw.date ?? "",
        endDate: raw.endDate ?? null,
        venue: raw.venue ?? [],
        category: raw.category ?? [],
        postcode: raw.postcode ?? [],
        link: raw.link ?? "",
        isFree: Boolean(raw.isFree),
        isSpotlight: Boolean(raw.isSpotlight),
        coverImage: raw.coverImage ?? null,
        slug: raw.slug ?? null,
    };
}

export interface Venue {
    id: string;
    name: string;
    categories: string[];
    link: string;
}
