"use client";

import { useState } from "react";
import { Event } from "@/lib/notion";

interface CalendarViewProps {
    events: Event[];
}

// Get days in month
function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

// Get first day of month (0 = Sunday, 1 = Monday, etc.)
function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
}

// Format date for display
function formatEventDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({ events }: CalendarViewProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    // Navigate to previous month
    const goToPreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
        setSelectedDate(null);
    };

    // Navigate to next month
    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
        setSelectedDate(null);
    };

    // Go to today
    const goToToday = () => {
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
        setSelectedDate(null);
    };

    // Group events by date
    const eventsByDate: Record<string, Event[]> = {};
    events.forEach((event) => {
        if (event.date) {
            const dateKey = event.date.split("T")[0];
            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = [];
            }
            eventsByDate[dateKey].push(event);
        }
    });

    // Build calendar grid
    const calendarDays: (number | null)[] = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    // Check if viewing current month
    const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

    // Get selected day events
    const selectedDayEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

    // Handle day click
    const handleDayClick = (day: number) => {
        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        if (selectedDate === dateKey) {
            setSelectedDate(null); // Toggle off if already selected
        } else {
            setSelectedDate(dateKey);
        }
    };

    // Format selected date for display
    const formatSelectedDate = () => {
        if (!selectedDate) return "";
        const date = new Date(selectedDate);
        return date.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    return (
        <div className="calendar-view">
            <div className="calendar-header">
                <button
                    className="calendar-nav-btn"
                    onClick={goToPreviousMonth}
                    aria-label="Previous month"
                >
                    ← Prev
                </button>

                <div className="calendar-title">
                    <h2 className="calendar-month">
                        {monthNames[currentMonth]} {currentYear}
                    </h2>
                    {!isCurrentMonth && (
                        <button className="today-btn" onClick={goToToday}>
                            Today
                        </button>
                    )}
                </div>

                <button
                    className="calendar-nav-btn"
                    onClick={goToNextMonth}
                    aria-label="Next month"
                >
                    Next →
                </button>
            </div>

            <div className="calendar-grid">
                {/* Day headers */}
                {dayNames.map((day) => (
                    <div key={day} className="calendar-day-header">
                        {day}
                    </div>
                ))}

                {/* Calendar cells */}
                {calendarDays.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className="calendar-cell empty" />;
                    }

                    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dayEvents = eventsByDate[dateKey] || [];
                    const isToday = isCurrentMonth && day === today.getDate();
                    const isSelected = selectedDate === dateKey;

                    return (
                        <div
                            key={day}
                            className={`calendar-cell ${isToday ? "today" : ""} ${dayEvents.length > 0 ? "has-events" : ""} ${isSelected ? "selected" : ""}`}
                            onClick={() => handleDayClick(day)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && handleDayClick(day)}
                        >
                            <span className="calendar-day-number">{day}</span>
                            <span className="calendar-event-count">
                                {dayEvents.length > 0 && `${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}`}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Selected Day Events Panel */}
            {selectedDate && (
                <div className="selected-day-panel">
                    <div className="selected-day-header">
                        <h3>{formatSelectedDate()}</h3>
                        <button
                            className="close-panel-btn"
                            onClick={() => setSelectedDate(null)}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>

                    {selectedDayEvents.length === 0 ? (
                        <p className="no-events-message">No events on this day</p>
                    ) : (
                        <div className="selected-day-events">
                            {selectedDayEvents.map((event) => (
                                <a
                                    key={event.id}
                                    href={event.link || "#"}
                                    className="day-event-card"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <div className="day-event-time">
                                        {event.date.includes("T") ? formatEventDate(event.date) : "All day"}
                                    </div>
                                    <div className="day-event-title">{event.title}</div>
                                    {event.venue.length > 0 && (
                                        <div className="day-event-venue">{event.venue.join(", ")}</div>
                                    )}
                                    {(event.isSpotlight || event.category.length > 0) && (
                                        <div className="day-event-categories">
                                            {event.isSpotlight && (
                                                <span className="day-event-category day-event-spotlight">
                                                    Spotlight Event
                                                </span>
                                            )}
                                            {event.category.map(cat => (
                                                <span key={cat} className="day-event-category">{cat}</span>
                                            ))}
                                        </div>
                                    )}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
