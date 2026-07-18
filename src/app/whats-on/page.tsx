import { fetchEvents } from "@/lib/api-events";
import EventsClient from "@/components/EventsClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Metadata } from "next";

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
  const searchParamsObj = await searchParams;
  
  const categoryStr = typeof searchParamsObj.category === 'string' ? searchParamsObj.category : '';
  const monthStr = typeof searchParamsObj.month === 'string' ? searchParamsObj.month : '';
  
  let titlePrefix = categoryStr ? `${categoryStr.charAt(0).toUpperCase() + categoryStr.slice(1)} Events` : "What's On";
  let descPrefix = categoryStr ? `Find the best ${categoryStr} events and shows` : "Find out what's on";
  
  if (categoryStr && (categoryStr.toLowerCase() === 'theatre' || categoryStr.toLowerCase() === 'comedy')) {
      titlePrefix = `${categoryStr.charAt(0).toUpperCase() + categoryStr.slice(1)} Shows & Events`;
  } else if (categoryStr && categoryStr.toLowerCase() === 'art') {
      titlePrefix = `Art Exhibitions & Artist Showcases`;
  }
  
  let timeContext = "today";
  if (monthStr) {
      timeContext = `in ${monthStr}`;
  }
  
  let canonicalUrl = `https://bhculturecalendar.co.uk/whats-on`;
  if (categoryStr || monthStr) {
      const params = new URLSearchParams();
      if (categoryStr) params.set('category', categoryStr);
      if (monthStr) params.set('month', monthStr);
      canonicalUrl += `?${params.toString()}`;
  }

  return {
    title: `${titlePrefix} Bournemouth | 2026 Events & Shows`,
    description: `${descPrefix} in Bournemouth, Christchurch, and Poole ${timeContext}. Discover the best local events, theatre shows, art exhibitions, and comedy gigs.`,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: [
      `what's on bournemouth`,
      `whats on bournemouth ${timeContext}`,
      `${categoryStr || 'events'} in bournemouth`,
      `bournemouth ${categoryStr || 'events'}`,
      `things to do in bournemouth`,
      `bournemouth shows`
    ],
    openGraph: {
      title: `${titlePrefix} in Bournemouth | BH Culture Calendar`,
      description: `${descPrefix} in Bournemouth ${timeContext}. Plan your visit with the best art, comedy, theatre, and gigs in the BCP area.`,
      url: canonicalUrl,
      siteName: 'BH Culture Calendar',
      locale: 'en_GB',
      type: 'website',
    },
  };
}

export default async function WhatsOnPage({
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const events = await fetchEvents();
  const searchParamsObj = await searchParams;
  const categoryStr = typeof searchParamsObj.category === 'string' ? searchParamsObj.category : '';
  const monthStr = typeof searchParamsObj.month === 'string' ? searchParamsObj.month : '';

  // Extract unique categories
  const allCategories = Array.from(
    new Set(events.flatMap((event) => event.category))
  ).sort();

  return (
    <>
      {/* Header */}
      <Header events={events} />

      {/* Main Content */}
      <main className="main">
        <h1 style={{ position: "absolute", width: "1px", height: "1px", padding: "0", margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: "0" }}>
          {categoryStr ? `${categoryStr.charAt(0).toUpperCase() + categoryStr.slice(1)} Events and Shows` : "What's On"} in Bournemouth {monthStr ? `in ${monthStr}` : ""}
        </h1>
        <EventsClient events={events} allCategories={allCategories} />
      </main>

      {/* Footer */}
      <Footer />
      <ScrollToTop />
    </>
  );
}
