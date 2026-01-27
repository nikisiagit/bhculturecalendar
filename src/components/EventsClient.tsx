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

function generateIcsData(event: Event): string {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatDate(event.date);
    let end;

    if (event.endDate) {
        end = formatDate(event.endDate);
    } else {
        const d = new Date(event.date);
        d.setHours(d.getHours() + 1);
        end = formatDate(d.toISOString());
    }

    const description = `Category: ${event.category.join(', ')}\\n\\n(Added via BH Culture Calendar)`;
    const location = event.venue.join(', ') + (event.postcode.length ? ` ${event.postcode.join(', ')}` : '');

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `SUMMARY:${event.title}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    return `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
}

function generateGoogleUrl(event: Event): string {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatDate(event.date);
    let end;
    if (event.endDate) {
        end = formatDate(event.endDate);
    } else {
        const d = new Date(event.date);
        d.setHours(d.getHours() + 1);
        end = formatDate(d.toISOString());
    }

    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(`Category: ${event.category.join(', ')}\n\n(Added via BH Culture Calendar)`);
    const location = encodeURIComponent(event.venue.join(', ') + (event.postcode.length ? ` ${event.postcode.join(', ')}` : ''));

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

function generateOutlookUrl(event: Event): string {
    const start = new Date(event.date).toISOString();
    let end;
    if (event.endDate) {
        end = new Date(event.endDate).toISOString();
    } else {
        const d = new Date(event.date);
        d.setHours(d.getHours() + 1);
        end = d.toISOString();
    }

    const title = encodeURIComponent(event.title);
    const body = encodeURIComponent(`Category: ${event.category.join(', ')}\n\n(Added via BH Culture Calendar)`);
    const location = encodeURIComponent(event.venue.join(', ') + (event.postcode.length ? ` ${event.postcode.join(', ')}` : ''));

    return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${start}&enddt=${end}&subject=${title}&body=${body}&location=${location}`;
}

// Event Card Component
function EventCard({ event }: { event: Event }) {
    const [showCalendarOptions, setShowCalendarOptions] = useState(false);

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

                <div className="calendar-wrapper">
                    <button
                        className="add-calendar-btn"
                        onClick={() => setShowCalendarOptions(!showCalendarOptions)}
                        aria-expanded={showCalendarOptions}
                        type="button"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                            <line x1="12" y1="14" x2="12" y2="18"></line>
                            <line x1="10" y1="16" x2="14" y2="16"></line>
                        </svg>
                        Add to Calendar
                    </button>

                    {showCalendarOptions && (
                        <div className="calendar-dropdown">
                            <a href={generateGoogleUrl(event)} target="_blank" rel="noopener noreferrer" className="calendar-option">
                                Google Calendar
                            </a>
                            <a href={generateOutlookUrl(event)} target="_blank" rel="noopener noreferrer" className="calendar-option">
                                Outlook
                            </a>
                            <a
                                href={generateIcsData(event)}
                                download={`${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`}
                                className="calendar-option"
                            >
                                Apple Calendar
                            </a>
                        </div>
                    )}
                </div>
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
