import { MetadataRoute } from 'next';

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://bhculturecalendar.co.uk';

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
    ];
}
