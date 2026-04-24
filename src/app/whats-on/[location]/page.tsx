import { getEvents } from "@/lib/notion";
import EventsClient from "@/components/EventsClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Metadata } from "next";
import { notFound } from "next/navigation";

const VALID_LOCATIONS = [
  "bournemouth", "christchurch", "poole",
  "swanage", "wareham", "wimborne",
  "ferndown", "ringwood", "new-milton", "verwood"
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
    // Broad match for empty postcodes
    if (!event.postcode || event.postcode.length === 0) {
      // Check if venue matches
      if (event.venue.some(v => v.toLowerCase().includes(lowerLocation))) return true;
      // If we really have no data, we could include it, but let's be strict for location pages
      // so the AI sees purely relevant things. We'll include it if venue matches or if it's completely generic.
      return event.venue.length === 0;
    }

    const prefixMatch = event.postcode[0].match(/^BH(\d+)/i);
    if (prefixMatch) {
      const num = parseInt(prefixMatch[1], 10);
      if (lowerLocation === "bournemouth" && num >= 1 && num <= 11) return true;
      if (lowerLocation === "poole" && num >= 12 && num <= 18) return true;
      if (lowerLocation === "swanage" && num === 19) return true;
      if (lowerLocation === "wareham" && num === 20) return true;
      if (lowerLocation === "wimborne" && num === 21) return true;
      if (lowerLocation === "ferndown" && num === 22) return true;
      if (lowerLocation === "christchurch" && num === 23) return true;
      if (lowerLocation === "ringwood" && num === 24) return true;
      if (lowerLocation === "new-milton" && num === 25) return true;
      if (lowerLocation === "verwood" && num === 31) return true;
    }

    const venueMatch = event.venue.some(v => v.toLowerCase().includes(lowerLocation));
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
