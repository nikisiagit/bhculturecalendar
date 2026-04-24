import { MetadataRoute } from 'next';

export const dynamic = "force-static";

const VALID_LOCATIONS = [
  "bournemouth", "christchurch", "poole",
  "swanage", "wareham", "wimborne",
  "ferndown", "ringwood", "new-milton", "verwood", "dorset"
];

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://bhculturecalendar.co.uk';

    const locationRoutes = VALID_LOCATIONS.map((location) => ({
        url: `${baseUrl}/whats-on/${location}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/venues`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/whats-on`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        ...locationRoutes,
    ];
}
