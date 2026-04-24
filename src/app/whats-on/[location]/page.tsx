import { getEvents } from "@/lib/notion";
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

  return {
    title: `What's On ${town} | 2026 Art, Theatre & Comedy Events`,
    description: `Find out what's on in ${town}. Discover the best local events, theatre shows, art exhibitions, and comedy gigs today.`,
    alternates: {
      canonical: `https://bhculturecalendar.co.uk/whats-on/${location.toLowerCase()}`,
    },
    keywords: [
      `what's on ${town}`,
      `whats on ${town} today`,
      `whats on ${town} this weekend`,
      `events in ${town}`,
      `${town} events`,
      `things to do in ${town}`,
    ],
    openGraph: {
      title: `What's On in ${town} | BH Culture Calendar`,
      description: `Discover what's on in ${town} today and this weekend. Plan your visit with the best art, comedy, theatre, and gigs.`,
      url: `https://bhculturecalendar.co.uk/whats-on/${location.toLowerCase()}`,
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
  params 
}: { 
  params: Promise<{ location: string }> 
}) {
  const { location } = await params;
  const lowerLocation = location.toLowerCase();

  if (!VALID_LOCATIONS.includes(lowerLocation)) {
    notFound();
  }

  const town = getTownName(lowerLocation);
  const allEvents = await getEvents();
  
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
        <section className="location-intro" style={{ padding: "3rem 1rem 1rem", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "var(--font-size-xxl)", marginBottom: "1rem", fontFamily: "var(--font-display)" }}>What's On in {town}</h1>
          <p style={{ fontSize: "var(--font-size-md)", color: "var(--color-text-light)", lineHeight: "1.6" }}>
            Looking for what's on in {town} today? Browse our curated calendar of the best theatre shows, art exhibitions, comedy gigs, and live events happening right now.
          </p>
        </section>

        <EventsClient events={events} allCategories={allCategories} />
      </main>

      {/* Footer */}
      <Footer />
      <ScrollToTop />
    </>
  );
}
