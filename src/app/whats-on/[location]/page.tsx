import { fetchEvents } from "@/lib/api-events";
import EventsClient from "@/components/EventsClient";
import { getLocalityFromPostcode } from "@/lib/location";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Metadata } from "next";
import { notFound } from "next/navigation";

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
  
  let titlePrefix = "What's On";
  let descPrefix = "Find out what's on";
  let timeContext = "today";
  let canonicalUrl = `https://bhculturecalendar.co.uk/whats-on/${location.toLowerCase()}`;

  return {
    title: `${titlePrefix} ${town} | 2026 Events & Culture`,
    description: `${descPrefix} in ${town} ${timeContext}. Discover the best local events, theatre shows, art exhibitions, and comedy gigs.`,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: [
      `what's on ${town}`,
      `whats on ${town} ${timeContext}`,
      `events in ${town}`,
      `${town} events`,
      `things to do in ${town}`,
      `${town} shows`
    ],
    openGraph: {
      title: `${titlePrefix} in ${town} | BH Culture Calendar`,
      description: `${descPrefix} in ${town} ${timeContext}. Plan your visit with the best art, comedy, theatre, and gigs.`,
      url: canonicalUrl,
      siteName: 'BH Culture Calendar',
      locale: 'en_GB',
      type: 'website',
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

  const categoryStr = '';
  const monthStr = '';

  const town = getTownName(lowerLocation);
  const allEvents = await fetchEvents();
  
  // Filter events based on location
  const events = allEvents.filter(event => {
    const locality = getLocalityFromPostcode(event.postcode).toLowerCase();
    const normalizedLocality = locality.replace(/\s+/g, '-');

    if (normalizedLocality === lowerLocation) return true;

    // Check if venue matches (e.g. if venue has 'new milton' and lowerLocation is 'new-milton')
    const searchString = lowerLocation.replace(/-/g, ' ');
    const venueMatch = event.venue.some(v => v.toLowerCase().includes(searchString));
    if (venueMatch) return true;

    return false;
  });

  // Extract unique categories
  const allCategories = Array.from(
    new Set(events.flatMap((event) => event.category))
  ).sort();

  return (
    <>
      {/* Header */}
      <Header events={allEvents} />

      {/* Main Content */}
      <main className="main">
        <h1 style={{ position: "absolute", width: "1px", height: "1px", padding: "0", margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: "0" }}>
          What's On in {town}
        </h1>

        <EventsClient
          events={events}
          allCategories={allCategories}
          locationFilter={lowerLocation}
        />
      </main>

      {/* Footer */}
      <Footer />
      <ScrollToTop />
    </>
  );
}
