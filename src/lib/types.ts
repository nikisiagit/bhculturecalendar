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

export interface Venue {
    id: string;
    name: string;
    categories: string[];
    link: string;
}
