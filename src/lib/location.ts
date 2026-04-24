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
