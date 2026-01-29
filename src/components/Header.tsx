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
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Check local storage or system preference on mount
        const saved = localStorage.getItem('theme');
        if (saved) {
            setTheme(saved);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            if (isMenuOpen) {
                setIsVisible(true);
                return;
            }

            const currentScrollY = window.scrollY;

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
            <div className="header-main-bar">
                <div className="header-left">
                    <p className="header-tagline">
                        Connecting consumers and culture
                        <br />
                        in the BH postcode area
                    </p>
                </div>

                <div className="header-center">
                    <Link href="/" className="logo-link" onClick={() => setIsMenuOpen(false)}>
                        <Image
                            src="/logo.png"
                            alt="Culture Calendar"
                            width={160}
                            height={160}
                            className="logo-image brand-logo"
                            priority
                        />
                    </Link>
                </div>

                <div className="header-right">
                    <button
                        className="theme-btn"
                        onClick={toggleTheme}
                        aria-label="Toggle dark mode"
                        style={{ marginRight: '1rem' }}
                    >
                        {theme === 'light' ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                        )}
                    </button>
                    <button
                        className="menu-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMenuOpen}
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {isMenuOpen ? (
                                <>
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </>
                            ) : (
                                <>
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </>
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Navigation Overlay */}
            <div className={`nav-overlay ${isMenuOpen ? 'open' : ''}`}>
                <nav className="overlay-nav">
                    <Link
                        href="/"
                        className={`overlay-nav-link ${pathname === "/" ? "active" : ""}`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        WHAT&apos;S ON
                    </Link>
                    <Link
                        href="/venues"
                        className={`overlay-nav-link ${pathname === "/venues" ? "active" : ""}`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        VENUES
                    </Link>
                    <Link
                        href="/about"
                        className={`overlay-nav-link ${pathname === "/about" ? "active" : ""}`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        ABOUT
                    </Link>
                </nav>
            </div>

            {todaysCount > 0 && (
                <div className="today-banner-bar">
                    <div className="today-banner-content">
                        <span className="live-indicator">● TODAY</span>
                        <span className="live-event-title">
                            {todaysCount} event{todaysCount !== 1 ? 's' : ''} happening
                        </span>
                    </div>
                </div>
            )}
        </header>
    );
}
