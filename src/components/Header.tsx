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

    const [isVisible, setIsVisible] = useState(true);



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
                        className="menu-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                <line x1="6" y1="18" x2="18" y2="6"></line>
                            </svg>
                        ) : (
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        )}
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
        </header>
    );
}
