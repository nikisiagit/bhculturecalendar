import { getEvents } from "@/lib/notion";
import EventsClient from "@/components/EventsClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "What's On Bournemouth | 2026 Art, Theatre & Comedy Events",
  description: "Find out what's on in Bournemouth, Christchurch, and Poole. Discover the best local events, theatre shows, art exhibitions, and comedy gigs today.",
  alternates: {
    canonical: 'https://bhculturecalendar.co.uk/whats-on',
  },
  keywords: [
    "what's on bournemouth",
    "whats on bournemouth today",
    "whats on bournemouth this weekend",
    "events in bournemouth",
    "bournemouth events",
    "things to do in bournemouth",
  ],
  openGraph: {
    title: "What's On in Bournemouth | BH Culture Calendar",
    description: "Discover what's on in Bournemouth today and this weekend. Plan your visit with the best art, comedy, theatre, and gigs in the BCP area.",
    url: 'https://bhculturecalendar.co.uk/whats-on',
    siteName: 'BH Culture Calendar',
    locale: 'en_GB',
    type: 'website',
  },
};

export default async function WhatsOnPage() {
  const events = await getEvents();

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
        <EventsClient events={events} allCategories={allCategories} />
      </main>

      {/* Footer */}
      <Footer />
      <ScrollToTop />
    </>
  );
}
