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
    const [liveEvent, setLiveEvent] = useState<Event | null>(null);

    useEffect(() => {
        const checkLiveEvents = () => {
            const now = new Date();
            const activeEvent = events.find(event => {
                if (!event.date) return false;
                const start = new Date(event.date);
                // Assume 2 hour duration if no end date provided, or use end date
                const end = event.endDate
                    ? new Date(event.endDate)
                    : new Date(start.getTime() + 2 * 60 * 60 * 1000);

                // If it's a multi-day event (has endDate different day), check if we are within the range
                // But for "LIVE NOW", usually implies specifically happening this moment.
                // Simple logic: Start <= Now <= End
                return now >= start && now <= end;
            });
            setLiveEvent(activeEvent || null);
        };

        checkLiveEvents();
        const interval = setInterval(checkLiveEvents, 60000); // Check every minute
        return () => clearInterval(interval);
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

                    {liveEvent && (
                        <div className="live-event-banner">
                            <span className="live-indicator">● LIVE NOW</span>
                            <span className="live-event-title">{liveEvent.title}</span>
                            <span className="live-event-venue">@ {liveEvent.venue[0]}</span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
