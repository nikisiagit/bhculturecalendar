import { fetchEvents } from "@/lib/api-events";
import EventsClient from "@/components/EventsClient";
import { getLocalityFromPostcode } from "@/lib/location";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL, buildItemListJsonLd, categoryPath } from "@/lib/seo";

const VALID_LOCATIONS = [
  "bournemouth", "christchurch", "poole",
  "swanage", "wareham", "wimborne",
  "ferndown", "ringwood", "new-milton", "verwood", "dorset"
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getTownName(locationSlug: string): string {
  if (locationSlug === "new-milton") return "New Milton";
  return capitalize(locationSlug);
}

export async function generateMetadata(
  { params }: { params: Promise<{ location: string }> }
): Promise<Metadata> {
  const { location } = await params;
  
  if (!VALID_LOCATIONS.includes(location.toLowerCase())) {
    return {};
  }
  
  const town = getTownName(location.toLowerCase());
  const canonicalUrl = `${SITE_URL}/whats-on/${location.toLowerCase()}`;

  return {
    title: `What's On ${town} | 2026 Events, Theatre, Art & Comedy`,
    description: `Find what's on in ${town} — theatre shows, art exhibitions, comedy, festivals and free events. BH Culture Calendar for the BCP / BH postcode area.`,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: [
      `what's on ${town}`,
      `whats on ${town} 2026`,
      `events in ${town}`,
      `${town} events`,
      `things to do in ${town}`,
      `${town} theatre`,
      `${town} shows`,
    ],
    openGraph: {
      title: `What's On in ${town} | BH Culture Calendar`,
      description: `Discover art, comedy, theatre and festivals in ${town} and the BH postcode area.`,
      url: canonicalUrl,
      siteName: "BH Culture Calendar",
      locale: "en_GB",
      type: "website",
    },
  };
}

export function generateStaticParams() {
  return VALID_LOCATIONS.map((location) => ({
    location,
  }));
}

export default async function LocationWhatsOnPage({ 
  params,
}: { 
  params: Promise<{ location: string }>;
}) {
  const { location } = await params;
  const lowerLocation = location.toLowerCase();

  if (!VALID_LOCATIONS.includes(lowerLocation)) {
    notFound();
  }

  const town = getTownName(lowerLocation);
  const allEvents = await fetchEvents();

  const events = allEvents.filter((event) => {
    const locality = getLocalityFromPostcode(event.postcode).toLowerCase();
    const normalizedLocality = locality.replace(/\s+/g, "-");

    if (normalizedLocality === lowerLocation) return true;

    const searchString = lowerLocation.replace(/-/g, " ");
    const venueMatch = event.venue.some((v) =>
      v.toLowerCase().includes(searchString)
    );
    if (venueMatch) return true;

    return false;
  });

  const allCategories = Array.from(
    new Set(events.flatMap((event) => event.category))
  ).sort();

  const jsonLd = buildItemListJsonLd(
    events,
    `What's on in ${town}`,
    `${SITE_URL}/whats-on/${lowerLocation}`
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header events={allEvents} />

      <main className="main">
        <header className="seo-page-header">
          <h1 className="page-title seo-h1">What&apos;s on in {town}</h1>
          <p className="seo-lead">
            Theatre, art, comedy and cultural events in {town} and the surrounding BH
            postcode area. {events.length} listing{events.length === 1 ? "" : "s"} on
            BH Culture Calendar.
          </p>
          {allCategories.length > 0 && (
            <nav className="seo-category-nav" aria-label="Categories in this town">
              {allCategories.map((cat) => (
                <Link key={cat} href={categoryPath(cat)} className="seo-chip">
                  {cat}
                </Link>
              ))}
            </nav>
          )}
          <p className="seo-body">
            Also see{" "}
            <Link href="/whats-on">all what&apos;s on</Link>,{" "}
            <Link href="/venues">venues</Link>, and nearby{" "}
            <Link href="/whats-on/bournemouth">Bournemouth</Link>,{" "}
            <Link href="/whats-on/poole">Poole</Link>,{" "}
            <Link href="/whats-on/christchurch">Christchurch</Link>.
          </p>
        </header>

        <EventsClient
          events={events}
          allCategories={allCategories}
          locationFilter={lowerLocation}
        />
      </main>

      <Footer />
      <ScrollToTop />
    </>
  );
}
