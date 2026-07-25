"use client";

import { useCallback, useEffect, useState } from "react";
import type { Event } from "@/lib/types";
import { fetchEventsClient } from "@/lib/client-api";

/** How often the open site refetches the API (must be ≤ 60s for “within a minute”). */
export const LIVE_EVENTS_POLL_MS = 45_000;

/**
 * Keeps event list fresh from the Mobile API while the tab is open.
 * - Polls every 45s
 * - Refetches when the tab becomes visible again
 * - Starts from SSR/build snapshot (initialEvents)
 */
export function useLiveEvents(initialEvents: Event[]) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If the parent passes a new SSR snapshot (rare on static export), adopt it
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchEventsClient();
      setEvents(next);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh events");
    }
  }, []);

  useEffect(() => {
    // Immediate refresh on mount so a stale static shell catches up quickly
    void refresh();

    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, LIVE_EVENTS_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { events, lastUpdated, error, refresh };
}
