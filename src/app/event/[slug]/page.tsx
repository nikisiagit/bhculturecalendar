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
  venuePath,
} from "@/lib/seo";

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
  if (!event) return { title: "Event not found" };

  const townHint = event.postcode[0] ? ` (${event.postcode[0]})` : "";
  const venue = event.venue[0] ? ` at ${event.venue[0]}` : "";
  const title = `${event.title.trim()}${venue} | What's On Bournemouth area`;
  const description = [
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
      ...(event.coverImage ? { images: [{ url: event.coverImage }] } : {}),
    },
    keywords: [
      event.title.trim(),
      ...event.category.map((c) => `${c} bournemouth`),
      ...event.venue,
      "what's on bournemouth",
      "bcp events",
      townHint.trim(),
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
  if (!event) notFound();

  const jsonLd = buildEventJsonLd(event);
  const dateLabel = formatEventDateRange(event.date, event.endDate);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header events={events} />
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

        <article className="seo-event-detail">
          {event.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.coverImage}
              alt={`${event.title.trim()} — event in the Bournemouth area`}
              className="seo-event-image"
            />
          )}

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
              <Link key={cat} href={categoryPath(cat)} className="tag category">
                {cat}
              </Link>
            ))}
            {event.isFree && <span className="tag free">Free</span>}
          </div>

          <p className="seo-body">
            Listed on BH Culture Calendar — what&apos;s on in Bournemouth, Christchurch,
            Poole and the wider BH postcode area. Categories:{" "}
            {event.category.join(", ") || "culture"}.
            {event.isFree ? " This listing is marked as free entry." : ""}
          </p>

          <div className="seo-actions">
            {event.link && (
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
                <Link href="/whats-on/bournemouth">What&apos;s on in Bournemouth</Link>
              </li>
              <li>
                <Link href="/whats-on/poole">What&apos;s on in Poole</Link>
              </li>
              <li>
                <Link href="/venues">All venues</Link>
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
