import { MetadataRoute } from "next";
import { fetchEvents } from "@/lib/api-events";
import {
  SITE_URL,
  categoryPath,
  eventPath,
  getCategorySlug,
  getVenueSlug,
  venuePath,
} from "@/lib/seo";

export const dynamic = "force-static";

const VALID_LOCATIONS = [
  "bournemouth",
  "christchurch",
  "poole",
  "swanage",
  "wareham",
  "wimborne",
  "ferndown",
  "ringwood",
  "new-milton",
  "verwood",
  "dorset",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const now = new Date();

  let events: Awaited<ReturnType<typeof fetchEvents>> = [];
  try {
    events = await fetchEvents();
  } catch {
    events = [];
  }

  const locationRoutes = VALID_LOCATIONS.map((location) => ({
    url: `${baseUrl}/whats-on/${location}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const categories = Array.from(new Set(events.flatMap((e) => e.category)));
  const categoryRoutes = categories.map((cat) => ({
    url: `${baseUrl}${categoryPath(cat)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.75,
  }));

  const venues = Array.from(new Set(events.flatMap((e) => e.venue)));
  const venueRoutes = venues.map((v) => ({
    url: `${baseUrl}${venuePath(v)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const eventRoutes = events.map((event) => ({
    url: `${baseUrl}${eventPath(event)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.65,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/venues`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/whats-on`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...locationRoutes,
    ...categoryRoutes,
    ...venueRoutes,
    ...eventRoutes,
  ];
}
