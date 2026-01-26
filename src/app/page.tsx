import { getEvents } from "@/lib/notion";
import EventsClient from "@/components/EventsClient";
import Link from "next/link";
import Image from "next/image";


export default async function Home() {
  const events = await getEvents();

  // Extract unique categories
  const allCategories = Array.from(
    new Set(events.flatMap((event) => event.category))
  ).sort();

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <Link href="/" className="logo-link">
            <Image
              src="/logo.png"
              alt="Culture Calendar"
              width={300}
              height={60}
              className="logo-image"
              priority
            />
          </Link>

          <nav className="nav">
            <Link href="/" className="nav-link active">
              WHAT&apos;S ON
            </Link>
            <Link href="/venues" className="nav-link">
              VENUES
            </Link>
            <Link href="/about" className="nav-link">
              ABOUT
            </Link>
            <Link href="/" className="nav-highlight">
              TODAY&apos;S EVENTS
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <EventsClient events={events} allCategories={allCategories} />
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Culture Calendar. Made with ❤️ for the local community.</p>
      </footer>
    </>
  );
}
