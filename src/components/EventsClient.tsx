"use client";

import { useState, useMemo } from "react";
import { Event } from "@/lib/notion";
import FilterBar from "./FilterBar";
import CalendarView from "./CalendarView";

interface EventsClientProps {
    events: Event[];
    allCategories: string[];
}

// Format date range
function formatDateRange(start: string, end: string | null): string {
    if (!start) return "Date TBC";

    const startDate = new Date(start);
    const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
    };

    const startStr = startDate.toLocaleDateString("en-GB", options);

    if (end) {
        const endDate = new Date(end);
        const endStr = endDate.toLocaleDateString("en-GB", options);
        return `${startStr} — ${endStr}`;
    }

    if (start.includes("T")) {
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: "2-digit",
            minute: "2-digit",
        };
        const timeStr = startDate.toLocaleTimeString("en-GB", timeOptions);
        return `${startStr}, ${timeStr}`;
    }

    return startStr;
}

// Event Card Component
function EventCard({ event }: { event: Event }) {
    return (
        <article className="event-card">
            <div className="event-image-wrapper">
                {event.coverImage ? (
                    <img
                        src={event.coverImage}
                        alt={event.title}
                        className="event-image"
                        loading="lazy"
                    />
                ) : (
                    <div className="event-image-placeholder">🎭</div>
                )}
            </div>

            <div className="event-content">
                <div className="event-tags">
                    {event.category.map((cat) => (
                        <span key={cat} className="tag category">
                            {cat}
                        </span>
                    ))}
                    {event.isFree && <span className="tag free">Free</span>}
                    <span className="tag itinerary">+ itinerary</span>
                </div>

                <h2 className="event-title">
                    {event.link ? (
                        <a href={event.link} target="_blank" rel="noopener noreferrer">
                            {event.title}
                        </a>
                    ) : (
                        event.title
                    )}
                </h2>

                <p className="event-date">{formatDateRange(event.date, event.endDate)}</p>

                {event.venue.length > 0 && (
                    <p className="event-venue">
                        {event.venue.join(", ")}
                        {event.postcode.length > 0 && ` (${event.postcode.join(", ")})`}
                    </p>
                )}
            </div>
        </article>
    );
}

export default function EventsClient({ events, allCategories }: EventsClientProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");

    // Filter events based on selected category
    const filteredEvents = useMemo(() => {
        if (!selectedCategory) return events;
        return events.filter((event) => event.category.includes(selectedCategory));
    }, [events, selectedCategory]);

    return (
        <>
            <FilterBar
                categories={allCategories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {viewMode === "calendar" ? (
                <CalendarView events={filteredEvents} />
            ) : (
                <>
                    {filteredEvents.length === 0 ? (
                        <div className="empty-state">
                            <h2>No events found</h2>
                            <p>
                                {selectedCategory
                                    ? `No events in the "${selectedCategory}" category.`
                                    : "Check back soon for upcoming events!"}
                            </p>
                        </div>
                    ) : (
                        <div className="events-grid">
                            {filteredEvents.map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </>
    );
}
