"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const APP_STORE_URL =
    "https://apps.apple.com/gb/app/bh-calendar/id6788507839?utm_source=website&utm_medium=banner&utm_campaign=ios_launch";
const DISMISS_KEY = "app_promo_dismissed";

export default function AppPromoBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!localStorage.getItem(DISMISS_KEY)) {
            setVisible(true);
        }
    }, []);

    const dismiss = () => {
        localStorage.setItem(DISMISS_KEY, "1");
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <aside className="app-promo-banner" aria-label="BH Calendar iOS app">
            <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="app-promo-link"
            >
                <Image
                    src="/app-icon.png"
                    alt=""
                    width={48}
                    height={48}
                    className="app-promo-icon"
                />
                <div className="app-promo-copy">
                    <p className="app-promo-title">BH Calendar is on iOS</p>
                    <p className="app-promo-subtitle">Your guide to BH Culture is now in your pocket — Download our Free iOS App</p>
                </div>
                <Image
                    src="/download-on-the-app-store.svg"
                    alt="Download on the App Store"
                    width={120}
                    height={40}
                    className="app-promo-badge"
                    unoptimized
                />
            </a>
            <button
                type="button"
                className="app-promo-dismiss"
                onClick={dismiss}
                aria-label="Dismiss app promotion"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
            </button>
        </aside>
    );
}
