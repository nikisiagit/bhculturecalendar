import { fetchEvents } from "@/lib/api-events";
import EventsClient from "@/components/EventsClient";
import { getLocalityFromPostcode } from "@/lib/location";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL, buildItemListJsonLd } from "@/lib/seo";

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
        <h1 className="visually-hidden">What&apos;s on in {town}</h1>
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
