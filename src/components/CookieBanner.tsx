'use client';

import { useState, useEffect } from "react";
import Script from "next/script";

export default function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [consentGranted, setConsentGranted] = useState(false);
    const GA_MEASUREMENT_ID = 'G-JCWTLQ4F23';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedConsent = localStorage.getItem("cookie_consent");
            if (storedConsent === "granted") {
                setConsentGranted(true);
            } else if (!storedConsent) {
                setShowBanner(true);
            }
        }
    }, []);

    const acceptCookie = () => {
        setConsentGranted(true); // Triggers GA and Clarity load
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
            {/* Google Analytics - Only load if consent is EXPLICITLY granted */}
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

                            // Audit Consent Mode v2: Explicitly pass all four parameters
                            gtag('consent', 'default', {
                                'analytics_storage': 'denied',
                                'ad_storage': 'denied',
                                'ad_user_data': 'denied',
                                'ad_personalization': 'denied'
                            });
                            
                            gtag('consent', 'update', {
                                'analytics_storage': 'granted',
                                'ad_storage': 'granted',
                                'ad_user_data': 'granted',
                                'ad_personalization': 'granted'
                            });

                            gtag('js', new Date());
                            gtag('config', '${GA_MEASUREMENT_ID}');
                        `}
                    </Script>
                </>
            )}

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
