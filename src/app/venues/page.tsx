import { fetchVenues, fetchEvents } from "@/lib/api-events";
import { Venue } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { venuePath } from "@/lib/seo";


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
    const [venues, events] = await Promise.all([fetchVenues(), fetchEvents()]);
    const groupedVenues = groupVenuesByLetter(venues);
    const letters = Object.keys(groupedVenues).sort();

    // Get unique categories
    const allCategories = Array.from(
        new Set(venues.flatMap(v => v.categories))
    ).sort();

    return (
        <>
            {/* Header */}
            <Header events={events} />

            {/* Main Content */}
            <main className="main">
                <h1 className="page-title">VENUES & SITES</h1>

                <p className="venues-intro">
                    Discover cultural venues, galleries, theatres, and event spaces across
                    Bournemouth, Christchurch, Poole and the BH postcode area. Open a venue
                    for what&apos;s on next.
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
                                            <Link href={venuePath(venue.name)}>
                                                {venue.name}
                                            </Link>
                                            {venue.link ? (
                                                <a
                                                    href={venue.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="venue-external"
                                                    aria-label={`${venue.name} official website`}
                                                >
                                                    <svg
                                                        className="external-icon"
                                                        width="1em"
                                                        height="1em"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <line x1="7" y1="17" x2="17" y2="7"></line>
                                                        <polyline points="7 7 17 7 17 17"></polyline>
                                                    </svg>
                                                </a>
                                            ) : null}
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
            {/* Footer */}
            <Footer />
        </>
    );
}
