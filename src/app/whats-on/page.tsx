import { fetchEvents } from "@/lib/api-events";
import EventsClient from "@/components/EventsClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Metadata } from "next";
import { SITE_URL, buildItemListJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = `${SITE_URL}/whats-on`;

  return {
    title: `What's On Bournemouth, Poole & Christchurch | 2026 Events & Shows`,
    description: `Find what's on in Bournemouth, Christchurch and Poole today and this week. Theatre, art exhibitions, comedy, festivals and free events in the BCP / BH postcode area.`,
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
      title: `What's On in Bournemouth, Christchurch & Poole | BH Culture Calendar`,
      description: `Discover art, comedy, theatre and festivals in the BH postcode area. Plan your visit with the best local events.`,
      url: canonicalUrl,
      siteName: "BH Culture Calendar",
      locale: "en_GB",
      type: "website",
    },
  };
}

export default async function WhatsOnPage() {
  const events = await fetchEvents();

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
