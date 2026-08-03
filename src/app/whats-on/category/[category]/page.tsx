import { fetchEvents } from "@/lib/api-events";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  SITE_URL,
  buildItemListJsonLd,
  categoryPath,
  eventPath,
  findEventsByCategory,
  formatEventDateRange,
  getCategorySlug,
  resolveCategoryLabel,
  venuePath,
} from "@/lib/seo";

export async function generateStaticParams() {
  try {
    const events = await fetchEvents();
    const cats = Array.from(new Set(events.flatMap((e) => e.category)));
    return cats.map((category) => ({ category: getCategorySlug(category) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const events = await fetchEvents();
  const label = resolveCategoryLabel(events, categorySlug);
  const matching = findEventsByCategory(events, categorySlug);
  if (matching.length === 0 && !label) return { title: "Category not found" };

  const title = `${label} Events in Bournemouth, Poole & Christchurch | 2026`;
  const description = `Find ${label.toLowerCase()} events in Bournemouth, Christchurch, Poole and the BH postcode area. ${matching.length} listings on BH Culture Calendar.`;
  const url = `${SITE_URL}${categoryPath(label)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [
      `${label.toLowerCase()} bournemouth`,
      `${label.toLowerCase()} poole`,
      `${label.toLowerCase()} christchurch`,
      `what's on ${label.toLowerCase()} bcp`,
      "bournemouth events 2026",
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

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const allEvents = await fetchEvents();
  const label = resolveCategoryLabel(allEvents, categorySlug);
  const events = findEventsByCategory(allEvents, categorySlug).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (events.length === 0) notFound();

  const listUrl = `${SITE_URL}${categoryPath(label)}`;
  const jsonLd = buildItemListJsonLd(
    events,
    `${label} events in the Bournemouth area`,
    listUrl
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header events={allEvents} />
      <main className="main seo-landing">
        <nav className="seo-breadcrumb" aria-label="Breadcrumb">
          <Link href="/whats-on">What&apos;s On</Link>
          <span aria-hidden="true"> / </span>
          <span>{label}</span>
        </nav>

        <h1 className="page-title seo-h1">{label} events in Bournemouth, Poole &amp; Christchurch</h1>
        <p className="seo-lead">
          Discover {events.length} {label.toLowerCase()} listing
          {events.length === 1 ? "" : "s"} across the BH postcode area — Bournemouth,
          Christchurch, Poole and nearby towns. Updated from our live culture calendar.
        </p>

        <p className="seo-body">
          Looking for{" "}
          <strong>{label.toLowerCase()} in Bournemouth</strong>, Poole or Christchurch?
          Browse upcoming dates below, or explore{" "}
          <Link href="/whats-on">all what&apos;s on</Link> and{" "}
          <Link href="/venues">venues</Link>.
        </p>

        <ul className="seo-event-list">
          {events.map((event) => (
            <li key={event.id} className="seo-event-list-item">
              <Link href={eventPath(event)} className="seo-event-list-title">
                {event.title.trim()}
              </Link>
              <p className="seo-event-list-meta">
                {formatEventDateRange(event.date, event.endDate)}
                {event.venue[0] && (
                  <>
                    {" · "}
                    <Link href={venuePath(event.venue[0])}>{event.venue[0]}</Link>
                  </>
                )}
                {event.isFree && " · Free"}
              </p>
            </li>
          ))}
        </ul>

        <section className="seo-related">
          <h2 className="seo-section-title">Popular towns</h2>
          <ul className="seo-link-list seo-link-list-inline">
            <li><Link href="/whats-on/bournemouth">Bournemouth</Link></li>
            <li><Link href="/whats-on/poole">Poole</Link></li>
            <li><Link href="/whats-on/christchurch">Christchurch</Link></li>
            <li><Link href="/whats-on/wimborne">Wimborne</Link></li>
            <li><Link href="/whats-on">All locations</Link></li>
          </ul>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
