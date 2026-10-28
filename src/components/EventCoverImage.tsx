"use client";

import { getDefaultThumbnail } from "@/lib/default-thumbnails";

interface EventCoverImageProps {
  coverImage: string | null | undefined;
  categories: string[];
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

/**
 * Renders an event cover, falling back to a category default when the URL
 * is missing or fails to load.
 */
export default function EventCoverImage({
  coverImage,
  categories,
  alt,
  className,
  loading = "lazy",
}: EventCoverImageProps) {
  const fallback = getDefaultThumbnail(categories);
  const cover = coverImage?.trim() || null;
  const initialSrc = cover || fallback;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external Notion/CDN URLs + static export
    <img
      src={initialSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={(e) => {
        const img = e.currentTarget;
        // Direct DOM swap is more reliable than setState for img onError
        // (avoids stale handlers / remount races with broken remote URLs).
        if (!img.src.includes("/defaults/")) {
          img.src = fallback;
        }
      }}
    />
  );
}
