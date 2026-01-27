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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [todaysCount, setTodaysCount] = useState<number>(0);

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const count = events.filter(event => {
            if (!event.date) return false;
            const start = new Date(event.date);
            const end = event.endDate ? new Date(event.endDate) : new Date(start);
            return start < tomorrow && end >= today;
        }).length;

        setTodaysCount(count);
    }, [events]);

    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            if (isMenuOpen) {
                setIsVisible(true);
                return;
            }

            const currentScrollY = window.scrollY;

            // Hide if scrolling down and past 50px
            // Show if scrolling up
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }

            lastScrollY = currentScrollY > 0 ? currentScrollY : 0;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isMenuOpen]);

    return (
        <header className={`header ${!isVisible ? 'header-hidden' : ''}`}>
            <div className="header-content">
                <Link href="/" className="logo-link" onClick={() => setIsMenuOpen(false)}>
                    <Image
                        src="/logo.png"
                        alt="Culture Calendar"
                        width={300}
                        height={60}
                        className="logo-image"
                        priority
                    />
                </Link>

                <button
                    className="mobile-menu-btn"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isMenuOpen}
                >
                    {isMenuOpen ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    )}
                </button>

                <div className={`nav-container ${isMenuOpen ? 'is-open' : ''}`}>
                    <nav className="nav">
                        <Link
                            href="/"
                            className={`nav-link ${pathname === "/" ? "active" : ""}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            WHAT&apos;S ON
                        </Link>
                        <Link
                            href="/venues"
                            className={`nav-link ${pathname === "/venues" ? "active" : ""}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            VENUES
                        </Link>
                        <Link
                            href="/about"
                            className={`nav-link ${pathname === "/about" ? "active" : ""}`}
                            onClick={() => setIsMenuOpen(false)}
                        >
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
