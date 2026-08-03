"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Event } from "@/lib/notion";
import FilterBar from "./FilterBar";
import CalendarView from "./CalendarView";
import FeaturedCarousel from "./FeaturedCarousel";
import Link from "next/link";
import { useLiveEvents } from "@/hooks/useLiveEvents";
import { getLocalityFromPostcode } from "@/lib/location";
import { categoryPath, eventPath, venuePath } from "@/lib/seo";

interface EventsClientProps {
    events: Event[];
    allCategories: string[];
    /** When set, live API refreshes re-apply this location filter (whats-on/[location]). */
    locationFilter?: string | null;
}
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

function EventCard({ event }: { event: Event }) {
    const [showCalendarOptions, setShowCalendarOptions] = useState(false);
    const [imageError, setImageError] = useState(false);

    return (
        <article className={`event-card ${showCalendarOptions ? 'z-active' : ''}`}>
            <div className="event-image-wrapper">
                {event.coverImage && !imageError ? (
                    <img
                        src={event.coverImage}
                        alt={event.title}
                        className="event-image"
                        loading="lazy"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="event-image-placeholder">🎭</div>
                )}
            </div>

            <div className="event-content">
                <div className="event-tags">
                    {event.category.map((cat) => (
                        <Link key={cat} href={categoryPath(cat)} className="tag category">
                            {cat}
                        </Link>
                    ))}
                    {event.isFree && <span className="tag free">Free</span>}
                </div>

                <h2 className="event-title">
                    <Link href={eventPath(event)}>{event.title}</Link>
                </h2>

                <p className="event-date">{formatDateRange(event.date, event.endDate)}</p>

                {event.venue.length > 0 && (
                    <p className="event-venue">
                        {event.venue.map((v, i) => (
                            <span key={v}>
                                {i > 0 ? ", " : ""}
                                <Link href={venuePath(v)}>{v}</Link>
                            </span>
                        ))}
                        {event.postcode.length > 0 && ` (${event.postcode.join(", ")})`}
                    </p>
                )}
                {event.link && (
                    <p className="event-official-link">
                        <a href={event.link} target="_blank" rel="noopener noreferrer">
                            Official page / tickets
                        </a>
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

function filterEventsByLocation(events: Event[], locationSlug: string): Event[] {
    const lowerLocation = locationSlug.toLowerCase();
    return events.filter((event) => {
        const locality = getLocalityFromPostcode(event.postcode).toLowerCase();
        const normalizedLocality = locality.replace(/\s+/g, "-");
        if (normalizedLocality === lowerLocation) return true;
        const searchString = lowerLocation.replace(/-/g, " ");
        return event.venue.some((v) => v.toLowerCase().includes(searchString));
    });
}

function EventsClientContent({ events: initialEvents, allCategories: initialCategories, locationFilter }: EventsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { events: liveEvents } = useLiveEvents(initialEvents);

    // Live list from API; re-apply location scope when on /whats-on/[location]
    const events = useMemo(() => {
        if (locationFilter) {
            return filterEventsByLocation(liveEvents, locationFilter);
        }
        return liveEvents;
    }, [liveEvents, locationFilter]);

    const allCategories = useMemo(() => {
        const fromLive = Array.from(new Set(events.flatMap((e) => e.category))).sort();
        return fromLive.length > 0 ? fromLive : initialCategories;
    }, [events, initialCategories]);

    // Read state from URL or fallback to null/false
    const selectedCategory = searchParams.get("category");
    const showToday = searchParams.get("today") === "true";
    const showTomorrow = searchParams.get("tomorrow") === "true";
    const showWeekend = searchParams.get("weekend") === "true";
    const showFreeOnly = searchParams.get("free") === "true";
    const searchQuery = searchParams.get("search") || "";

    const pathname = usePathname();

    let selectedLocation = null;
    if (pathname.startsWith('/whats-on/') && pathname !== '/whats-on/') {
        selectedLocation = pathname.replace('/whats-on/', '');
    }

    // View mode can stay local state as it is preference, not content filtering
    const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");

    const handleLocationChange = (location: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        const newPath = location ? `/whats-on/${location}` : '/whats-on';
        router.push(`${newPath}?${params.toString()}`, { scroll: false });
    };

    // Helper to update URL
    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === null || value === "false") {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        allCategories.forEach(cat => counts[cat] = 0);
        events.forEach(event => {
            event.category.forEach(cat => {
                if (counts[cat] !== undefined) {
                    counts[cat]++;
                }
            });
        });
        return counts;
    }, [events, allCategories]);

    // Filter events based on selected category and date
    const filteredEvents = useMemo(() => {
        let filtered = events;

        if (selectedCategory) {
            filtered = filtered.filter((event) => event.category.includes(selectedCategory));
        }

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            filtered = filtered.filter((event) =>
                event.title.toLowerCase().includes(lowerQ)
            );
        }

        if (showFreeOnly) {
            filtered = filtered.filter((event) => event.isFree);
        }

        if (showToday || showTomorrow || showWeekend) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

            // Weekend Calculation (Friday 5pm UTC - Sunday Midnight)
            const currentDay = today.getDay(); // 0=Sun, 6=Sat
            let weekendStart = new Date(today);
            let weekendEnd = new Date(today);

            // Calculate offset to Friday of the current weekend block
            // Sun(0) -> -2, Sat(6) -> -1, Fri(5) -> 0, Mon(1) -> +4
            let offsetToFri = 0;
            if (currentDay === 0) offsetToFri = -2;
            else if (currentDay === 6) offsetToFri = -1;
            else offsetToFri = 5 - currentDay;

            weekendStart.setDate(today.getDate() + offsetToFri);
            weekendStart.setHours(0, 0, 0, 0); // Start Friday midnight local time

            weekendEnd = new Date(weekendStart);
            weekendEnd.setDate(weekendStart.getDate() + 2); // Friday + 2 days = Sunday
            weekendEnd.setHours(23, 59, 59, 999);

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

                const overlapsWeekend = showWeekend && (
                    (eventStart < weekendEnd && eventEnd >= weekendStart)
                );

                return overlapsToday || overlapsTomorrow || overlapsWeekend;
            });
        }

        // Sort the filtered events so that events starting today or later appear before ongoing past events
        const todayForSort = new Date();
        todayForSort.setHours(0, 0, 0, 0);

        const sortedFiltered = [...filtered].sort((a, b) => {
            const aStart = new Date(a.date);
            const bStart = new Date(b.date);
            
            const aIsOngoing = aStart < todayForSort && a.endDate && new Date(a.endDate) >= todayForSort;
            const bIsOngoing = bStart < todayForSort && b.endDate && new Date(b.endDate) >= todayForSort;

            if (aIsOngoing && !bIsOngoing) return 1; // b comes first
            if (!aIsOngoing && bIsOngoing) return -1; // a comes first
            
            // Otherwise sort by start date ascending
            return aStart.getTime() - bStart.getTime();
        });

        return sortedFiltered;
    }, [events, selectedCategory, showToday, showTomorrow, showWeekend, showFreeOnly, searchQuery]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "itemListElement": events.map((event, index) => ({
                            "@type": "ListItem",
                            "position": index + 1,
                            "item": {
                                "@type": "Event",
                                "name": event.title,
                                "startDate": event.date,
                                "endDate": event.endDate,
                                "eventStatus": "https://schema.org/EventScheduled",
                                "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                                "location": {
                                    "@type": "Place",
                                    "name": event.venue.join(', ') || "TBC",
                                    "address": {
                                        "@type": "PostalAddress",
                                        "addressLocality": getLocalityFromPostcode(event.postcode),
                                        "addressRegion": "Dorset",
                                        "addressCountry": "UK"
                                    }
                                },
                                "image": [event.coverImage || "https://bhculturecalendar.co.uk/logo.png"],
                                "description": `Category: ${event.category.join(', ')}.`,
                                "offers": {
                                    "@type": "Offer",
                                    "url": event.link,
                                    "price": event.isFree ? "0" : undefined,
                                    "priceCurrency": "GBP",
                                    "availability": "https://schema.org/InStock"
                                }
                            }
                        }))
                    })
                }}
            />
            <FeaturedCarousel events={events} />
            <FilterBar
                categories={allCategories}
                categoryCounts={categoryCounts}
                selectedCategory={selectedCategory}
                onCategoryChange={(cat) => updateFilter("category", cat)}
                selectedLocation={selectedLocation}
                onLocationChange={handleLocationChange}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                showToday={showToday}
                onShowTodayChange={(val) => updateFilter("today", String(val))}
                showTomorrow={showTomorrow}
                onShowTomorrowChange={(val) => updateFilter("tomorrow", String(val))}
                showWeekend={showWeekend}
                onShowWeekendChange={(val) => updateFilter("weekend", String(val))}
                showFreeOnly={showFreeOnly}
                onShowFreeOnlyChange={(val) => updateFilter("free", String(val))}
                searchQuery={searchQuery}
                onSearchChange={(val) => updateFilter("search", val)}
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

export default function EventsClient(props: EventsClientProps) {
    return (
        <Suspense fallback={<div className="loading-spinner">Loading events...</div>}>
            <EventsClientContent {...props} />
        </Suspense>
    );
}
