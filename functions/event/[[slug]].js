/**
 * Cloudflare Pages Function: missing /event/<id> → venue (if archived) or /whats-on.
 *
 * Static HTML for live events wins over this Function. Exact lines in public/_redirects
 * still handle known orphans with venue targets. This covers every other unknown id
 * so Google never keeps a soft-404 on a former event URL.
 *
 * Archive snapshot is written by scripts/write-redirects.mjs → _archive.json
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
  const raw = context.params?.slug;
  const slug = Array.isArray(raw) ? raw.join("/") : raw;
  const entry = findEntry(slug);
  const target = redirectTarget(entry);
  const url = new URL(target, context.request.url);
  return Response.redirect(url.toString(), 301);
}
