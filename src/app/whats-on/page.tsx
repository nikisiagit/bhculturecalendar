import { fetchEvents } from "@/lib/api-events";
import EventsClient from "@/components/EventsClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Metadata } from "next";
import { SITE_URL, buildItemListJsonLd } from "@/lib/seo";
import { filterUpcomingEvents } from "@/lib/event-time";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = `${SITE_URL}/whats-on`;

  const title = "What's On in Bournemouth, Poole & Christchurch This Week";
  const description =
    "Theatre, art, comedy and festivals in Bournemouth, Christchurch and Poole today and this week. Free and ticketed events across the BH postcode area.";

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords: [
      "what's on bournemouth",
      "whats on bournemouth 2026",
      "events in bournemouth",
      "bournemouth events",
      "things to do in bournemouth",
      "what's on poole",
      "christchurch whats on",
      "bcp events",
    ],
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "BH Culture Calendar",
      locale: "en_GB",
      type: "website",
    },
  };
}

export default async function WhatsOnPage() {
  const allEvents = await fetchEvents();
  const events = filterUpcomingEvents(allEvents);

  const allCategories = Array.from(
    new Set(events.flatMap((event) => event.category))
  ).sort();

  const jsonLd = buildItemListJsonLd(
    events,
    "What's on in Bournemouth, Christchurch & Poole",
    `${SITE_URL}/whats-on`
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header events={events} />

      <main className="main">
        <h1 className="visually-hidden">
          What&apos;s on in Bournemouth, Poole and Christchurch
        </h1>
        <EventsClient events={events} allCategories={allCategories} />
      </main>

      <Footer />
      <ScrollToTop />
    </>
  );
}
