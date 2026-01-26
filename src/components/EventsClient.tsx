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
    const [showToday, setShowToday] = useState(false);
    const [showTomorrow, setShowTomorrow] = useState(false);

    // Filter events based on selected category and date
    const filteredEvents = useMemo(() => {
        let filtered = events;

        if (selectedCategory) {
            filtered = filtered.filter((event) => event.category.includes(selectedCategory));
        }

        if (showToday || showTomorrow) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

            filtered = filtered.filter((event) => {
                if (!event.date) return false;
                const eventStart = new Date(event.date);
                // Treat events without end date as single day events 
                const eventEnd = event.endDate ? new Date(event.endDate) : new Date(eventStart);
                // Set end of day for comparison
                eventEnd.setHours(23, 59, 59, 999);

                const overlapsToday = showToday && (
                    (eventStart >= today && eventStart < tomorrow) || // Starts today
                    (eventStart < today && eventEnd >= today) // Started before, ends today or later
                );

                const overlapsTomorrow = showTomorrow && (
                    (eventStart >= tomorrow && eventStart < dayAfterTomorrow) || // Starts tomorrow
                    (eventStart < tomorrow && eventEnd >= tomorrow) // Started before tomorrow, ends tomorrow or later
                );

                return overlapsToday || overlapsTomorrow;
            });
        }

        return filtered;
    }, [events, selectedCategory, showToday, showTomorrow]);

    return (
        <>
            <FilterBar
                categories={allCategories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                showToday={showToday}
                onShowTodayChange={setShowToday}
                showTomorrow={showTomorrow}
                onShowTomorrowChange={setShowTomorrow}
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
