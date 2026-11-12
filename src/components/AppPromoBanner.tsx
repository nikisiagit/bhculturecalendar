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
                    <p className="app-promo-subtitle">What&apos;s on in the BH area — free on the App Store</p>
                </div>
                <span className="app-promo-cta">
                    <svg
                        className="app-promo-apple"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        fill="currentColor"
                    >
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    Get the app
                </span>
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
