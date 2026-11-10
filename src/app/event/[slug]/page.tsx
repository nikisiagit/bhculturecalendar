import { fetchEvents } from "@/lib/api-events";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  SITE_URL,
  buildEventJsonLd,
  categoryPath,
  eventPath,
  findEventBySlug,
  formatEventDateRange,
  getEventSlug,
  getVenueSlug,
  venuePath,
} from "@/lib/seo";
import { getDefaultThumbnailAbsoluteUrl } from "@/lib/default-thumbnails";
import { isEventPast, filterUpcomingEvents } from "@/lib/event-time";
import {
  archiveRedirectTarget,
  findArchiveEntry,
  loadEventArchive,
} from "@/lib/event-archive";
import EventCoverImage from "@/components/EventCoverImage";

export async function generateStaticParams() {
  try {
    const events = await fetchEvents();
    return events.map((event) => ({ slug: getEventSlug(event) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const events = await fetchEvents();
  const event = findEventBySlug(events, slug);

  if (!event) {
    const archived = findArchiveEntry(loadEventArchive(), slug);
    if (archived) {
      const target = archiveRedirectTarget(archived);
      return {
        title: archived.title || "Event moved",
        robots: { index: false, follow: true },
        alternates: { canonical: `${SITE_URL}${target}` },
      };
    }
    return { title: "Event not found" };
  }

  const past = isEventPast(event);
  const venue = event.venue[0] ? ` at ${event.venue[0]}` : "";
  const title = past
    ? `${event.title.trim()}${venue} (finished)`
    : `${event.title.trim()}${venue} | What's On Bournemouth area`;

  const description = [
    past ? "This event has finished." : null,
    event.title.trim(),
    formatEventDateRange(event.date, event.endDate),
    event.venue.join(", "),
    event.category.join(", "),
    "BH Culture Calendar — Bournemouth, Christchurch & Poole events.",
  ]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 160);

  const url = `${SITE_URL}${eventPath(event)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: event.title.trim(),
      description,
      url,
      siteName: "BH Culture Calendar",
      locale: "en_GB",
      type: "website",
      images: [
        {
          url: event.coverImage || getDefaultThumbnailAbsoluteUrl(event.category),
        },
      ],
    },
    keywords: [
      event.title.trim(),
      ...event.category.map((c) => `${c} bournemouth`),
      ...event.venue,
      "what's on bournemouth",
      "bcp events",
    ].filter(Boolean) as string[],
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const events = await fetchEvents();
  const event = findEventBySlug(events, slug);

  // Truly missing from the API: build-time _redirects should 301 these.
  // If we still land here (e.g. local preview), send users onward without a soft 404.
  if (!event) {
    const archived = findArchiveEntry(loadEventArchive(), slug);
    if (archived) {
      const target = archiveRedirectTarget(archived);
      return (
        <>
          <Header events={filterUpcomingEvents(events)} />
          <main className="main seo-landing">
            <article className="seo-event-detail">
              <h1 className="page-title seo-h1">
                {archived.title.trim() || "This event is no longer listed"}
              </h1>
              <p className="seo-lead">
                This listing has been removed from our calendar. You&apos;ll be better served on
                the venue or what&apos;s-on page.
              </p>
              <div className="seo-actions">
                <Link href={target} className="seo-primary-btn">
                  {archived.venue[0] ? `What's on at ${archived.venue[0]}` : "Browse what's on"}
                </Link>
                <Link href="/whats-on" className="seo-secondary-btn">
                  All events
                </Link>
              </div>
              <p className="seo-body">
                Production serves a Cloudflare 301 from this URL to{" "}
                <Link href={target}>{target}</Link>.
              </p>
            </article>
          </main>
          <Footer />
          <ScrollToTop />
        </>
      );
    }
    notFound();
  }

  const past = isEventPast(event);
  const upcoming = filterUpcomingEvents(events);
  const jsonLd = buildEventJsonLd(event);
  const dateLabel = formatEventDateRange(event.date, event.endDate);

  const relatedVenue = upcoming
    .filter(
      (e) =>
        e.id !== event.id &&
        e.venue.some((v) => event.venue.some((ev) => getVenueSlug(ev) === getVenueSlug(v)))
    )
    .slice(0, 4);

  const relatedCategory = upcoming
    .filter(
      (e) =>
        e.id !== event.id &&
        !relatedVenue.some((r) => r.id === e.id) &&
        e.category.some((c) => event.category.includes(c))
    )
    .slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header events={upcoming} />
      <main className="main seo-landing">
        <nav className="seo-breadcrumb" aria-label="Breadcrumb">
          <Link href="/whats-on">What&apos;s On</Link>
          <span aria-hidden="true"> / </span>
          {event.category[0] && (
            <>
              <Link href={categoryPath(event.category[0])}>{event.category[0]}</Link>
              <span aria-hidden="true"> / </span>
            </>
          )}
          <span>{event.title.trim()}</span>
        </nav>

        <article className={`seo-event-detail${past ? " is-archived" : ""}`}>
          {past && (
            <p className="seo-finished-banner" role="status">
              This event has finished. It is kept here as an archive listing so links and search
              results still work.
            </p>
          )}

          <EventCoverImage
            coverImage={event.coverImage}
            categories={event.category}
            alt={`${event.title.trim()} — event in the Bournemouth area`}
            className="seo-event-image"
            loading="eager"
          />

          <h1 className="page-title seo-h1">{event.title.trim()}</h1>

          <p className="seo-lead">
            {dateLabel}
            {event.venue.length > 0 && (
              <>
                {" · "}
                {event.venue.map((v, i) => (
                  <span key={v}>
                    {i > 0 ? ", " : ""}
                    <Link href={venuePath(v)}>{v}</Link>
                  </span>
                ))}
              </>
            )}
            {event.postcode.length > 0 && ` (${event.postcode.join(", ")})`}
          </p>

          <div className="seo-tags">
            {event.category.map((cat) => (
              <span key={cat} className="tag category">
                {cat}
              </span>
            ))}
            {event.isFree && <span className="tag free">Free</span>}
            {past && <span className="tag">Finished</span>}
          </div>

          <p className="seo-body">
            {past
              ? "This event has finished. Browse upcoming events at the same venue or in the same category below."
              : `Listed on BH Culture Calendar — what's on in Bournemouth, Christchurch, Poole and the wider BH postcode area. Categories: ${event.category.join(", ") || "culture"}.${event.isFree ? " This listing is marked as free entry." : ""}`}
          </p>

          <div className="seo-actions">
            {!past && event.link && (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="seo-primary-btn"
              >
                Official page / tickets
              </a>
            )}
            <Link href="/whats-on" className="seo-secondary-btn">
              All events
            </Link>
          </div>

          {(relatedVenue.length > 0 || relatedCategory.length > 0) && (
            <section className="seo-related" aria-labelledby="related-upcoming-heading">
              <h2 id="related-upcoming-heading" className="seo-section-title">
                Upcoming nearby
              </h2>
              <ul className="seo-event-list">
                {relatedVenue.map((e) => (
                  <li key={e.id} className="seo-event-list-item">
                    <Link href={eventPath(e)} className="seo-event-list-title">
                      {e.title.trim()}
                    </Link>
                    <div className="seo-event-list-meta">
                      {formatEventDateRange(e.date, e.endDate)}
                      {e.venue[0] ? ` · ${e.venue[0]}` : ""}
                    </div>
                  </li>
                ))}
                {relatedCategory.map((e) => (
                  <li key={e.id} className="seo-event-list-item">
                    <Link href={eventPath(e)} className="seo-event-list-title">
                      {e.title.trim()}
                    </Link>
                    <div className="seo-event-list-meta">
                      {formatEventDateRange(e.date, e.endDate)}
                      {e.category[0] ? ` · ${e.category[0]}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="seo-related" aria-labelledby="related-heading">
            <h2 id="related-heading" className="seo-section-title">
              Explore more
            </h2>
            <ul className="seo-link-list">
              {event.category.map((cat) => (
                <li key={cat}>
                  <Link href={categoryPath(cat)}>
                    More {cat} events in the BCP area
                  </Link>
                </li>
              ))}
              {event.venue.map((v) => (
                <li key={v}>
                  <Link href={venuePath(v)}>What&apos;s on at {v}</Link>
                </li>
              ))}
              <li>
                <Link href="/whats-on">Browse all what&apos;s on</Link>
              </li>
            </ul>
          </section>
        </article>
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
