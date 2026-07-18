import { fetchEvents } from "@/lib/api-events";
import EventsClient from "@/components/EventsClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  let titlePrefix = "What's On";
  let descPrefix = "Find out what's on";
  let timeContext = "today";
  let canonicalUrl = `https://bhculturecalendar.co.uk/whats-on`;

  return {
    title: `${titlePrefix} Bournemouth | 2026 Events & Shows`,
    description: `${descPrefix} in Bournemouth, Christchurch, and Poole ${timeContext}. Discover the best local events, theatre shows, art exhibitions, and comedy gigs.`,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: [
      `what's on bournemouth`,
      `whats on bournemouth ${timeContext}`,
      `events in bournemouth`,
      `bournemouth events`,
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

export default async function WhatsOnPage() {
  const events = await fetchEvents();
  const categoryStr = '';
  const monthStr = '';

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
          What's On in Bournemouth
        </h1>
        <EventsClient events={events} allCategories={allCategories} />
      </main>

      {/* Footer */}
      <Footer />
      <ScrollToTop />
    </>
  );
}
