/** Category-specific default cover images when Notion/API cover URLs are missing or broken. */

const DEFAULT_THUMBNAILS: Record<string, string> = {
  theatre: "/defaults/theatre.png",
  art: "/defaults/art.png",
  comedy: "/defaults/comedy.png",
  dance: "/defaults/dance.png",
  film: "/defaults/film.png",
  "spoken word": "/defaults/spoken-word.png",
  "spoken-word": "/defaults/spoken-word.png",
};

/** Absolute site URL for OG/JSON-LD when no cover is available. */
const SITE_ORIGIN = "https://bhculturecalendar.co.uk";

/** Fallback when category is unknown or empty — brand theatre graphic. */
export const GENERIC_DEFAULT_THUMBNAIL = "/defaults/theatre.png";

function normalizeCategory(category: string): string {
  return category.trim().toLowerCase().replace(/[_/]+/g, " ").replace(/\s+/g, " ");
}

/**
 * Pick a default thumbnail path for an event's categories.
 * Uses the first recognised category; falls back to a generic brand image.
 */
export function getDefaultThumbnail(categories: string[] | null | undefined): string {
  if (!categories?.length) return GENERIC_DEFAULT_THUMBNAIL;

  for (const cat of categories) {
    const key = normalizeCategory(cat);
    const path = DEFAULT_THUMBNAILS[key];
    if (path) return path;
  }

  return GENERIC_DEFAULT_THUMBNAIL;
}

/** Absolute URL for metadata / structured data. */
export function getDefaultThumbnailAbsoluteUrl(
  categories: string[] | null | undefined
): string {
  const path = getDefaultThumbnail(categories);
  return `${SITE_ORIGIN}${path}`;
}

/**
 * Prefer a real cover URL; otherwise the category default.
 * Does not detect broken URLs — use EventCoverImage for runtime onError.
 */
export function resolveEventImageSrc(
  coverImage: string | null | undefined,
  categories: string[] | null | undefined
): string {
  const trimmed = coverImage?.trim();
  if (trimmed) return trimmed;
  return getDefaultThumbnail(categories);
}
