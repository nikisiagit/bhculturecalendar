"use client";

import { useState, useEffect } from "react";
import { Event } from "@/lib/notion";

// Helper to check if event starts strictly today
// Matches logic in Header.tsx
function isEventToday(event: Event): boolean {
    if (!event.date) return false;
    const today = new Date();
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === today.toDateString();
}

export default function FeaturedCarousel({ events }: { events: Event[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);

    useEffect(() => {
        const today = events.filter(isEventToday);
        setFilteredEvents(today);
    }, [events]);

    useEffect(() => {
        if (filteredEvents.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % filteredEvents.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [filteredEvents.length]);

    if (filteredEvents.length === 0) return null;

    const event = filteredEvents[currentIndex];

    const nextSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % filteredEvents.length);
    };

    const prevSlide = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + filteredEvents.length) % filteredEvents.length);
    };

    const goToSlide = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(idx);
    };

    return (
        <section className="featured-section">
            <h2 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
                What&apos;s on today
            </h2>

            <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="carousel-container"
            >
                <div className="carousel-slide">
                    {event.coverImage ? (
                        <img
                            src={event.coverImage}
                            alt={event.title}
                            className="carousel-image"
                        />
                    ) : (
                        <div className="carousel-placeholder" />
                    )}

                    <div className="carousel-overlay">
                        <h3 className="carousel-title">{event.title}</h3>
                        <div className="carousel-meta">
                            <span className="carousel-venue">{event.venue.join(', ')}</span>
                            {/* Time could be added here if available in formatted string */}
                        </div>
                        <span className="carousel-cta">Find out more</span>
                    </div>
                </div>

                {filteredEvents.length > 1 && (
                    <>
                        <button className="carousel-nav prev" onClick={prevSlide} aria-label="Previous slide">
                            ‹
                        </button>
                        <button className="carousel-nav next" onClick={nextSlide} aria-label="Next slide">
                            ›
                        </button>

                        <div className="carousel-dots">
                            {filteredEvents.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`dot ${idx === currentIndex ? 'active' : ''}`}
                                    onClick={(e) => goToSlide(idx, e)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </a>
        </section>
    );
}
