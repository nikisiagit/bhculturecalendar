"use client";

import { useEffect, useState } from "react";
import { getDefaultThumbnail } from "@/lib/default-thumbnails";

interface EventCoverImageProps {
  coverImage: string | null | undefined;
  categories: string[];
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

/** How long to wait for a remote cover before treating it as failed. */
const LOAD_TIMEOUT_MS = 5000;

/**
 * Renders an event cover, falling back to a category default when the URL
 * is missing, fails to load, or hangs (e.g. DNS / network errors).
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

  // Remount when the preferred URL changes so prior failure state cannot stick
  return (
    <CoverImage
      key={`${cover ?? ""}|${fallback}`}
      cover={cover}
      fallback={fallback}
      alt={alt}
      className={className}
      loading={loading}
    />
  );
}

function CoverImage({
  cover,
  fallback,
  alt,
  className,
  loading,
}: {
  cover: string | null;
  fallback: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [src, setSrc] = useState(cover || fallback);

  useEffect(() => {
    if (!cover) return;

    let cancelled = false;
    let settled = false;

    const finish = (next: string) => {
      if (cancelled || settled) return;
      settled = true;
      setSrc(next);
    };

    const probe = new window.Image();
    const timer = window.setTimeout(() => finish(fallback), LOAD_TIMEOUT_MS);

    probe.onload = () => {
      window.clearTimeout(timer);
      finish(cover);
    };
    probe.onerror = () => {
      window.clearTimeout(timer);
      finish(fallback);
    };
    probe.src = cover;

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      probe.onload = null;
      probe.onerror = null;
    };
  }, [cover, fallback]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external Notion/CDN URLs + static export
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.includes("/defaults/")) {
          img.src = fallback;
          setSrc(fallback);
        }
      }}
    />
  );
}
