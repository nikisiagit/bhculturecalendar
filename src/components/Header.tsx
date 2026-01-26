"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Event } from "@/lib/notion";

interface HeaderProps {
    events: Event[];
}

export default function Header({ events }: HeaderProps) {
    const pathname = usePathname();
    const [todaysCount, setTodaysCount] = useState<number>(0);

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Define "Today" range
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const count = events.filter(event => {
            if (!event.date) return false;
            const start = new Date(event.date);
            // If there's an end date use it, else rely on start date for "happening today"
            // For ongoing events (started before today, end after today), include them
            // For single day events started today, include them
            const end = event.endDate ? new Date(event.endDate) : new Date(start);
            // Ensure end date covers the full day if time isn't strict? 
            // Usually Notion dates have times. If start < today and end >= today...

            // Logic: Is the event "active" at any point today?
            // Meaning: start < tomorrow AND end >= today

            return start < tomorrow && end >= today;
        }).length;

        setTodaysCount(count);
    }, [events]);

    return (
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

                <div className="nav-container">
                    <nav className="nav">
                        <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
                            WHAT&apos;S ON
                        </Link>
                        <Link href="/venues" className={`nav-link ${pathname === "/venues" ? "active" : ""}`}>
                            VENUES
                        </Link>
                        <Link href="/about" className={`nav-link ${pathname === "/about" ? "active" : ""}`}>
                            ABOUT
                        </Link>
                    </nav>

                    {todaysCount > 0 && (
                        <div className="live-event-banner">
                            <span className="live-indicator">● TODAY</span>
                            <span className="live-event-title">
                                {todaysCount} event{todaysCount !== 1 ? 's' : ''} happening
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
