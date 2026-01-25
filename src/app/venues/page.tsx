import { getVenues, Venue } from "@/lib/notion";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 60;

// Group venues by first letter
function groupVenuesByLetter(venues: Venue[]): Record<string, Venue[]> {
    const grouped: Record<string, Venue[]> = {};

    venues.forEach(venue => {
        const firstLetter = venue.name.charAt(0).toUpperCase();
        if (!grouped[firstLetter]) {
            grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(venue);
    });

    return grouped;
}

export default async function VenuesPage() {
    const venues = await getVenues();
    const groupedVenues = groupVenuesByLetter(venues);
    const letters = Object.keys(groupedVenues).sort();

    // Get unique categories
    const allCategories = Array.from(
        new Set(venues.flatMap(v => v.categories))
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
                        <Link href="/" className="nav-link">
                            WHAT&apos;S ON
                        </Link>
                        <Link href="/venues" className="nav-link active">
                            VENUES
                        </Link>
                        <Link href="/about" className="nav-link">
                            ABOUT
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="main">
                <h1 className="page-title">VENUES & SITES</h1>

                <p className="venues-intro">
                    Discover cultural venues, galleries, theatres, and event spaces across the BH postcode area.
                </p>

                {/* Quick Stats */}
                <div className="venues-stats">
                    <div className="stat-item">
                        <span className="stat-number">{venues.length}</span>
                        <span className="stat-label">Venues</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{allCategories.length}</span>
                        <span className="stat-label">Categories</span>
                    </div>
                </div>

                {/* Alphabet Navigation */}
                <div className="alphabet-nav">
                    {letters.map(letter => (
                        <a key={letter} href={`#letter-${letter}`} className="alphabet-link">
                            {letter}
                        </a>
                    ))}
                </div>

                {/* Venues List */}
                <div className="venues-list">
                    {letters.map(letter => (
                        <section key={letter} id={`letter-${letter}`} className="venue-section">
                            <h2 className="venue-letter">{letter}</h2>
                            <div className="venue-grid">
                                {groupedVenues[letter].map(venue => (
                                    <div key={venue.id} className="venue-card">
                                        <h3 className="venue-name">
                                            {venue.link ? (
                                                <a href={venue.link} target="_blank" rel="noopener noreferrer">
                                                    {venue.name}
                                                    <span className="external-icon">↗</span>
                                                </a>
                                            ) : (
                                                venue.name
                                            )}
                                        </h3>
                                        {venue.categories.length > 0 && (
                                            <div className="venue-categories">
                                                {venue.categories.map(cat => (
                                                    <span key={cat} className="venue-category">{cat}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                {venues.length === 0 && (
                    <div className="empty-state">
                        <h2>No venues found</h2>
                        <p>Check back soon for venue listings!</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="footer">
                <p>© 2026 Culture Calendar. Made with ❤️ for the local community.</p>
            </footer>
        </>
    );
}
