"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_STORAGE_KEY } from "@/lib/analytics";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function ensureGtag() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
  }
}

/** Apply stored consent (or keep denied defaults for cookieless pings). */
export function applyStoredConsent() {
  ensureGtag();
  const stored =
    typeof window !== "undefined" ? localStorage.getItem(CONSENT_STORAGE_KEY) : null;
  const granted = stored === "granted";
  window.gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: granted ? "granted" : "denied",
    ad_user_data: granted ? "granted" : "denied",
    ad_personalization: granted ? "granted" : "denied",
  });
}

export function updateAnalyticsConsent(granted: boolean) {
  ensureGtag();
  window.gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: granted ? "granted" : "denied",
    ad_user_data: granted ? "granted" : "denied",
    ad_personalization: granted ? "granted" : "denied",
  });
}

/**
 * SPA page_view tracker. gtag.js + Consent Mode defaults are server-rendered
 * in the root layout so they appear in the initial HTML.
 */
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    ensureGtag();
    applyStoredConsent();
    const qs = searchParams?.toString();
    const pagePath = qs ? `${pathname}?${qs}` : pathname;
    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
