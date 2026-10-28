"use client";

import { useState } from "react";
import { getDefaultThumbnail, resolveEventImageSrc } from "@/lib/default-thumbnails";

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
  const preferred = resolveEventImageSrc(coverImage, categories);

  // Remount when the preferred URL changes so a prior onError does not stick
  return (
    <CoverImg
      key={preferred}
      preferred={preferred}
      fallback={fallback}
      alt={alt}
      className={className}
      loading={loading}
    />
  );
}

function CoverImg({
  preferred,
  fallback,
  alt,
  className,
  loading,
}: {
  preferred: string;
  fallback: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [src, setSrc] = useState(preferred);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external Notion/CDN URLs + static export
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}
