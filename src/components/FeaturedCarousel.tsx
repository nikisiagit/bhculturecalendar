"use client";

import { useState, useEffect, useRef } from "react";
import { Event } from "@/lib/notion";

// Helper to check if event starts strictly today
function isEventToday(event: Event): boolean {
    if (!event.date) return false;
    const today = new Date();
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === today.toDateString();
}

export default function FeaturedCarousel({ events }: { events: Event[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [progress, setProgress] = useState(0);
    const DURATION = 5000; // 5 seconds
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate percentage from center (-1 to 1)
        const xPct = (x / rect.width - 0.5) * 2;
        const yPct = (y / rect.height - 0.5) * 2;

        // Max rotation: 1.0 degree (Micro-interaction)
        const rotateX = -yPct * 1.0;
        const rotateY = xPct * 1.0;

        containerRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    };

    const handleMouseLeave = () => {
        if (!containerRef.current) return;
        containerRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    };

    useEffect(() => {
        const today = events.filter(isEventToday);
        setFilteredEvents(today);
    }, [events]);

    // Auto-advance logic
    useEffect(() => {
        if (filteredEvents.length <= 1) return;

        const startTime = Date.now();

        // Reset progress on slide change
        setProgress(0);

        // Animation frame loop for smooth progress bar
        let animationFrame: number;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min((elapsed / DURATION) * 100, 100);
            setProgress(pct);

            if (elapsed < DURATION) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                // Time's up, next slide
                setCurrentIndex((prev) => (prev + 1) % filteredEvents.length);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [currentIndex, filteredEvents.length]);

    if (filteredEvents.length === 0) return null;

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % filteredEvents.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + filteredEvents.length) % filteredEvents.length);
    };

    const goToSlide = (idx: number) => {
        setCurrentIndex(idx);
    };

    return (
        <section className="featured-section">
            <h2 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '1rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="live-dot"></span>
                What&apos;s on today
            </h2>

            <div
                className="carousel-container"
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ transition: 'transform 0.1s ease-out', willChange: 'transform' }}
            >
                {/* Slides Layer */}
                {filteredEvents.map((event, index) => (
                    <a
                        key={event.id}
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`carousel-slide-wrapper ${index === currentIndex ? 'active' : ''}`}
                        style={{
                            opacity: index === currentIndex ? 1 : 0,
                            pointerEvents: index === currentIndex ? 'auto' : 'none',
                            zIndex: index === currentIndex ? 1 : 0
                        }}
                    >
                        <div className="carousel-slide">
                            {event.coverImage ? (
                                <img
                                    src={event.coverImage}
                                    alt={event.title}
                                    className="carousel-image"
                                />
                            ) : (
                                <div className="carousel-placeholder">{event.title[0]}</div>
                            )}

                            <div className="carousel-overlay">
                                <h3 className="carousel-title">{event.title}</h3>
                                <div className="carousel-meta">
                                    <span className="carousel-venue">{event.venue.join(', ')}</span>
                                </div>
                                <span className="carousel-cta">Find out more</span>
                            </div>
                        </div>
                    </a>
                ))}

                {/* Controls Layer (Outside the Link) */}
                {filteredEvents.length > 1 && (
                    <>
                        <button className="carousel-nav prev" onClick={prevSlide} aria-label="Previous slide">
                            ‹
                        </button>
                        <button className="carousel-nav next" onClick={nextSlide} aria-label="Next slide">
                            ›
                        </button>

                        {/* Netflix-style Progress Bars */}
                        <div className="carousel-progress-container">
                            {filteredEvents.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`progress-track ${idx === currentIndex ? 'active' : ''}`}
                                    onClick={() => goToSlide(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                >
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: idx === currentIndex ? `${progress}%` : (idx < currentIndex ? '100%' : '0%'),
                                            // Optional: make past bars full and future empty
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
