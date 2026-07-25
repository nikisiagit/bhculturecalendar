export function getLocalityFromPostcode(postcodes: string[]): string {
    if (!postcodes || postcodes.length === 0) return "Dorset";
    
    // Check the first postcode in the array
    const prefixMatch = postcodes[0].match(/^BH(\d+)/i);
    if (!prefixMatch) return "Dorset";
    
    const num = parseInt(prefixMatch[1], 10);
    if (num >= 1 && num <= 11) return "Bournemouth";
    if (num >= 12 && num <= 18) return "Poole";
    if (num === 19) return "Swanage";
    if (num === 20) return "Wareham";
    if (num === 21) return "Wimborne";
    if (num === 22) return "Ferndown";
    if (num === 23) return "Christchurch";
    if (num === 24) return "Ringwood";
    if (num === 25) return "New Milton";
    if (num === 31) return "Verwood";
    
    return "Dorset";
}

import venueCoordinates from '../data/venue-coordinates.json';

const TOWN_CENTROIDS: Record<string, { lat: number; lng: number }> = {
    "Bournemouth": { lat: 50.7192, lng: -1.8795 },
    "Poole": { lat: 50.7151, lng: -1.9873 },
    "Christchurch": { lat: 50.7352, lng: -1.7777 },
    "Swanage": { lat: 50.6086, lng: -1.9619 },
    "Wareham": { lat: 50.6865, lng: -2.1098 },
    "Wimborne": { lat: 50.7997, lng: -1.9806 },
    "Ferndown": { lat: 50.8016, lng: -1.8887 },
    "Ringwood": { lat: 50.8465, lng: -1.7927 },
    "New Milton": { lat: 50.7540, lng: -1.6575 },
    "Verwood": { lat: 50.8805, lng: -1.8802 },
};

export function getCoordinatesForVenue(venueNames: string[], postcodes: string[]): { latitude: number; longitude: number } | null {
    // 1. Check curated venue pins
    const typedVenueCoordinates = venueCoordinates as Record<string, { latitude: number; longitude: number }>;
    for (const venue of venueNames) {
        if (typedVenueCoordinates[venue]) {
            return typedVenueCoordinates[venue];
        }
    }
    
    // 2. Fallback to town centroid
    const locality = getLocalityFromPostcode(postcodes);
    const centroid = TOWN_CENTROIDS[locality];
    
    if (centroid) {
        return { latitude: centroid.lat, longitude: centroid.lng };
    }
    
    return null;
}
