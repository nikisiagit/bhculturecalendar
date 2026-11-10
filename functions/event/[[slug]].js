/**
 * Cloudflare Pages Function: missing /event/<id> → venue (if archived) or /whats-on.
 *
 * Important: a matching Function can run before Pages' clean-URL static lookup, so
 * we always try env.ASSETS first and only redirect on a real 404. That keeps live
 * event HTML (200) intact while fixing deleted-event soft-404s.
 *
 * Archive snapshot is written by scripts/write-redirects.mjs → _archive.js
 */
import archive from "./_archive.js";

function slugify(value) {
  return (
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

function findEntry(slugOrId) {
  const key = decodeURIComponent(String(slugOrId || "")).toLowerCase();
  if (!key) return null;
  if (archive[key]) return archive[key];
  const compact = key.replace(/-/g, "");
  if (archive[compact]) return archive[compact];
  return (
    Object.values(archive).find(
      (e) =>
        e &&
        (String(e.id).toLowerCase() === key ||
          String(e.id).replace(/-/g, "").toLowerCase() === compact ||
          String(e.slug || "").toLowerCase() === key)
    ) || null
  );
}

function redirectTarget(entry) {
  if (!entry) return "/whats-on";
  if (entry.venueSlug) return `/venues/${entry.venueSlug}`;
  if (entry.venue?.[0]) return `/venues/${slugify(entry.venue[0])}`;
  return "/whats-on";
}

export async function onRequest(context) {
  // Prefer the static export when the event page was built.
  const asset = await context.env.ASSETS.fetch(context.request);
  if (asset.status !== 404) {
    return asset;
  }

  const raw = context.params?.slug;
  const slug = Array.isArray(raw) ? raw.join("/") : raw;
  const entry = findEntry(slug);
  const target = redirectTarget(entry);
  const url = new URL(target, context.request.url);
  return Response.redirect(url.toString(), 301);
}
