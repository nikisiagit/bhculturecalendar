'use client';

import { useState, useEffect } from "react";
import Script from "next/script";

export default function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [consentGranted, setConsentGranted] = useState(false);
    const GA_MEASUREMENT_ID = 'G-JCWTLQ4F23';

    useEffect(() => {
        // Check if user has already made a choice
        const storedConsent = localStorage.getItem("cookie_consent");

        if (storedConsent === "granted") {
            setConsentGranted(true);
        } else if (!storedConsent) {
            // Only show banner if no choice has been made
            setShowBanner(true);
        }
    }, []);

    const acceptCookie = () => {
        setConsentGranted(true);
        setShowBanner(false);
        localStorage.setItem("cookie_consent", "granted");
    };

    const declineCookie = () => {
        setConsentGranted(false);
        setShowBanner(false);
        localStorage.setItem("cookie_consent", "denied");
    };

    return (
        <>
            {consentGranted && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
                    </Script>
                </>
            )}

            {showBanner && (
                <div className="cookie-banner">
                    <p>We use cookies to improve your experience and analyze site traffic.</p>
                    <div className="cookie-buttons">
                        <button onClick={declineCookie} className="cookie-btn decline">Decline</button>
                        <button onClick={acceptCookie} className="cookie-btn accept">Accept</button>
                    </div>
                </div>
            )}
        </>
    );
}
