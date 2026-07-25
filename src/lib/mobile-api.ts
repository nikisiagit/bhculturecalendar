import { Event } from './types';
import { getCoordinatesForVenue, getLocalityFromPostcode } from './location';

export interface MobileEvent {
    id: string;
    title: string;
    date: string;
    endDate: string | null;
    category: string[];
    venue: string[];
    postcode: string[];
    location: string | null;
    latitude: number | null;
    longitude: number | null;
    isFree: boolean;
    coverImage: string | null;
    link: string | null;
    slug: string | null;
}

export function toMobileEvents(events: Event[]): MobileEvent[] {
    return events.map(event => {
        // Generate a basic URL slug
        const slug = event.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '') || event.id;
            
        // Determine location and coordinates
        const locationStr = getLocalityFromPostcode(event.postcode).toLowerCase();
        const coords = getCoordinatesForVenue(event.venue, event.postcode);
        
        return {
            id: event.id,
            title: event.title,
            date: event.date,
            endDate: event.endDate,
            category: event.category,
            venue: event.venue,
            postcode: event.postcode,
            location: locationStr,
            latitude: coords ? coords.latitude : null,
            longitude: coords ? coords.longitude : null,
            isFree: event.isFree,
            coverImage: event.coverImage,
            link: event.link,
            slug: slug
        };
    });
}
