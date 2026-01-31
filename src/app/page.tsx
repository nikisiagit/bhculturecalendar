import { getEvents } from "@/lib/notion";
import EventsClient from "@/components/EventsClient";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";


export default async function Home() {
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
      {/* Footer */}
      <Footer />
    </>
  );
}
