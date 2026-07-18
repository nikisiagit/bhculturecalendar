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
  { params, searchParams }: { params: Promise<{ location: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
  const { location } = await params;
  const searchParamsObj = await searchParams;
  
  if (!VALID_LOCATIONS.includes(location.toLowerCase())) {
    return {};
  }
  
  const town = getTownName(location.toLowerCase());
  
  const categoryStr = typeof searchParamsObj.category === 'string' ? searchParamsObj.category : '';
  const monthStr = typeof searchParamsObj.month === 'string' ? searchParamsObj.month : '';
  
  let titlePrefix = categoryStr ? `${capitalize(categoryStr)} Events` : "What's On";
  let descPrefix = categoryStr ? `Find the best ${categoryStr} events and shows` : "Find out what's on";
  
  if (categoryStr && (categoryStr.toLowerCase() === 'theatre' || categoryStr.toLowerCase() === 'comedy')) {
      titlePrefix = `${capitalize(categoryStr)} Shows & Events`;
  } else if (categoryStr && categoryStr.toLowerCase() === 'art') {
      titlePrefix = `Art Exhibitions & Artist Showcases`;
  }
  
  let timeContext = "today";
  if (monthStr) {
      // Basic formatting if month is provided like 2026-06
      timeContext = `in ${monthStr}`;
  }
  
  let canonicalUrl = `https://bhculturecalendar.co.uk/whats-on/${location.toLowerCase()}`;
  if (categoryStr || monthStr) {
      const params = new URLSearchParams();
      if (categoryStr) params.set('category', categoryStr);
      if (monthStr) params.set('month', monthStr);
      canonicalUrl += `?${params.toString()}`;
  }

  return {
    title: `${titlePrefix} ${town} | 2026 Events & Culture`,
    description: `${descPrefix} in ${town} ${timeContext}. Discover the best local events, theatre shows, art exhibitions, and comedy gigs.`,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: [
      `what's on ${town}`,
      `whats on ${town} ${timeContext}`,
      `${categoryStr || 'events'} in ${town}`,
      `${town} ${categoryStr || 'events'}`,
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
  searchParams 
}: { 
  params: Promise<{ location: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { location } = await params;
  const searchParamsObj = await searchParams;
  const lowerLocation = location.toLowerCase();

  if (!VALID_LOCATIONS.includes(lowerLocation)) {
    notFound();
  }

  const categoryStr = typeof searchParamsObj.category === 'string' ? searchParamsObj.category : '';
  const monthStr = typeof searchParamsObj.month === 'string' ? searchParamsObj.month : '';

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
          {categoryStr ? `${capitalize(categoryStr)} Events and Shows` : "What's On"} in {town} {monthStr ? `in ${monthStr}` : ""}
        </h1>

        <EventsClient events={events} allCategories={allCategories} />
      </main>

      {/* Footer */}
      <Footer />
      <ScrollToTop />
    </>
  );
}
