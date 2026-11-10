"use client";

import { useState, useEffect, Suspense } from "react";
import Script from "next/script";
import {
  CLARITY_PROJECT_ID,
  CONSENT_STORAGE_KEY,
} from "@/lib/analytics";
import GoogleAnalytics, { updateAnalyticsConsent } from "./GoogleAnalytics";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);

  useEffect(() => {
    const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (storedConsent === "granted") {
      setConsentGranted(true);
      updateAnalyticsConsent(true);
    } else if (storedConsent === "denied") {
      updateAnalyticsConsent(false);
    } else {
      setShowBanner(true);
    }
  }, []);

  const acceptCookie = () => {
    setConsentGranted(true);
    setShowBanner(false);
    localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    updateAnalyticsConsent(true);
  };

  const declineCookie = () => {
    setConsentGranted(false);
    setShowBanner(false);
    localStorage.setItem(CONSENT_STORAGE_KEY, "denied");
    updateAnalyticsConsent(false);
  };

  return (
    <>
      {/* GA always loads; Consent Mode v2 defaults to denied (cookieless pings). */}
      <Suspense fallback={null}>
        <GoogleAnalytics />
      </Suspense>

      {/* Clarity only when analytics cookies are allowed */}
      {consentGranted && (
        <Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
          `}
        </Script>
      )}

      {showBanner && (
        <div className="cookie-banner">
          <p>We use cookies to improve your experience and analyze site traffic.</p>
          <div className="cookie-buttons">
            <button onClick={declineCookie} className="cookie-btn decline" type="button">
              Decline
            </button>
            <button onClick={acceptCookie} className="cookie-btn accept" type="button">
              Accept
            </button>
          </div>
        </div>
      )}
    </>
  );
}
