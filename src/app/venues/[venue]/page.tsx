import { fetchEvents, fetchVenues } from "@/lib/api-events";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Link from "next/link";
import { Metadata } from "next";
import {
  SITE_URL,
  buildItemListJsonLd,
  categoryPath,
  eventPath,
  findEventsByVenue,
  formatEventDateRange,
  getVenueSlug,
  resolveVenueLabel,
  venuePath,
} from "@/lib/seo";

export async function generateStaticParams() {
  try {
    const [events, venues] = await Promise.all([fetchEvents(), fetchVenues()]);
    const names = new Set<string>([
      ...events.flatMap((e) => e.venue),
      ...venues.map((v) => v.name),
    ]);
    return Array.from(names).map((venue) => ({ venue: getVenueSlug(venue) }));
  } catch {
    return [];
  }
}

function resolveVenueName(
  events: Awaited<ReturnType<typeof fetchEvents>>,
  venues: Awaited<ReturnType<typeof fetchVenues>>,
  venueSlug: string
): string {
  const decoded = decodeURIComponent(venueSlug).toLowerCase();
  for (const e of events) {
    for (const v of e.venue) {
      if (getVenueSlug(v) === decoded) return v;
    }
  }
  for (const v of venues) {
    if (getVenueSlug(v.name) === decoded) return v.name;
  }
  return resolveVenueLabel(events, venueSlug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ venue: string }>;
}): Promise<Metadata> {
  const { venue: venueSlug } = await params;
  const [events, venues] = await Promise.all([fetchEvents(), fetchVenues()]);
  const label = resolveVenueName(events, venues, venueSlug);
  const matching = findEventsByVenue(events, venueSlug);
  const title = `What's On at ${label} | Events in the Bournemouth Area 2026`;
  const description =
    matching.length > 0
      ? `Upcoming events at ${label}. ${matching.length} listing${matching.length === 1 ? "" : "s"} on BH Culture Calendar — Bournemouth, Christchurch & Poole culture.`
      : `${label} on BH Culture Calendar — venues and culture in Bournemouth, Christchurch, Poole and the BH postcode area.`;
  const url = `${SITE_URL}${venuePath(label)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [
      `${label} events`,
      `${label} what's on`,
      `${label} bournemouth`,
      "venues bournemouth",
      "bcp events",
    ],
    openGraph: {
      title,
      description,
      url,
      siteName: "BH Culture Calendar",
      locale: "en_GB",
      type: "website",
    },
  };
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ venue: string }>;
}) {
  const { venue: venueSlug } = await params;
  const [allEvents, venues] = await Promise.all([fetchEvents(), fetchVenues()]);
  const label = resolveVenueName(allEvents, venues, venueSlug);
  const events = findEventsByVenue(allEvents, venueSlug).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const categories = Array.from(new Set(events.flatMap((e) => e.category))).sort();
  const listUrl = `${SITE_URL}${venuePath(label)}`;
  const jsonLd = buildItemListJsonLd(events, `Events at ${label}`, listUrl);

  return (
    <>
      {events.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Header events={allEvents} />
      <main className="main seo-landing">
        <nav className="seo-breadcrumb" aria-label="Breadcrumb">
          <Link href="/venues">Venues</Link>
          <span aria-hidden="true"> / </span>
          <span>{label}</span>
        </nav>

        <h1 className="page-title seo-h1">What&apos;s on at {label}</h1>
        <p className="seo-lead">
          {events.length > 0 ? (
            <>
              {events.length} upcoming event{events.length === 1 ? "" : "s"} listed for{" "}
              <strong>{label}</strong> on BH Culture Calendar — your guide to culture in
              Bournemouth, Christchurch, Poole and the BH postcode area.
            </>
          ) : (
            <>
              <strong>{label}</strong> is listed on BH Culture Calendar. There are no
              upcoming events in our feed right now — check back soon or browse{" "}
              <Link href="/whats-on">all what&apos;s on</Link>.
            </>
          )}
        </p>

        {categories.length > 0 && (
          <div className="seo-tags">
            {categories.map((cat) => (
              <Link key={cat} href={categoryPath(cat)} className="tag category">
                {cat}
              </Link>
            ))}
          </div>
        )}

        {events.length > 0 ? (
          <ul className="seo-event-list">
            {events.map((event) => (
              <li key={event.id} className="seo-event-list-item">
                <Link href={eventPath(event)} className="seo-event-list-title">
                  {event.title.trim()}
                </Link>
                <p className="seo-event-list-meta">
                  {formatEventDateRange(event.date, event.endDate)}
                  {event.category.length > 0 && ` · ${event.category.join(", ")}`}
                  {event.isFree && " · Free"}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        <section className="seo-related">
          <h2 className="seo-section-title">More ways to explore</h2>
          <ul className="seo-link-list">
            <li><Link href="/venues">All venues &amp; sites</Link></li>
            <li><Link href="/whats-on">All what&apos;s on</Link></li>
            <li><Link href="/whats-on/bournemouth">What&apos;s on in Bournemouth</Link></li>
            <li><Link href="/whats-on/poole">What&apos;s on in Poole</Link></li>
          </ul>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
