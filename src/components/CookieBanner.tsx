'use client';

import { useState, useEffect } from "react";
import Script from "next/script";

export default function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [consentGranted, setConsentGranted] = useState(false);
    const GA_MEASUREMENT_ID = 'G-JCWTLQ4F23';

    useEffect(() => {
        // Initialize GA Consent Mode defaults immediately
        // This ensures the tag is detected but respects privacy
        if (typeof window !== 'undefined') {
            window.dataLayer = window.dataLayer || [];
            function gtag() { window.dataLayer.push(arguments); }

            // Default to denied
            gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied'
            });

            // Check if previously granted
            const storedConsent = localStorage.getItem("cookie_consent");
            if (storedConsent === "granted") {
                setConsentGranted(true);
                gtag('consent', 'update', {
                    'analytics_storage': 'granted',
                    'ad_storage': 'granted'
                });
            } else if (!storedConsent) {
                setShowBanner(true);
            }
        }
    }, []);

    const acceptCookie = () => {
        setConsentGranted(true); // Triggers Clarity load
        setShowBanner(false);
        localStorage.setItem("cookie_consent", "granted");

        // Update GA Consent
        if (typeof window !== 'undefined') {
            const gtag = (window as any).gtag || function () { (window as any).dataLayer.push(arguments); };
            gtag('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted'
            });
        }
    };

    const declineCookie = () => {
        setConsentGranted(false);
        setShowBanner(false);
        localStorage.setItem("cookie_consent", "denied");
    };

    return (
        <>
            {/* Google Analytics - Always loaded but with Consent Mode (Privacy Safe) */}
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

            {/* Microsoft Clarity - Only load if consent is EXPLICITLY granted */}
            {consentGranted && (
                <Script id="clarity-script" strategy="afterInteractive">
                    {`
                        (function(c,l,a,r,i,t,y){
                            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                        })(window, document, "clarity", "script", "vai4iz9ei8");
                    `}
                </Script>
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

// Add global type definition for window to avoid TS errors
declare global {
    interface Window {
        dataLayer: any[];
    }
}
