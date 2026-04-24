"use client";

import { Event } from "@/lib/notion";
import { getLocalityFromPostcode } from "./EventsClient";
import Link from "next/link";
import { useMemo } from "react";

interface MapViewProps {
    events: Event[];
}

const TOWN_COLORS: Record<string, { bg: string, text: string }> = {
    "Bournemouth": { bg: "#FACC15", text: "#422006" }, // Yellow
    "Poole": { bg: "#2DD4BF", text: "#042F2E" }, // Teal
    "Christchurch": { bg: "#FB923C", text: "#431407" }, // Orange
    "Swanage": { bg: "#4ADE80", text: "#064E3B" }, // Green
    "Wareham": { bg: "#F59E0B", text: "#451A03" }, // Amber/Yellow-Orange
    "Wimborne": { bg: "#A78BFA", text: "#2E1065" }, // Purple
    "Ferndown": { bg: "#F472B6", text: "#500724" }, // Pink
    "Ringwood": { bg: "#60A5FA", text: "#1E3A8A" }, // Blue
    "New Milton": { bg: "#F87171", text: "#450A0A" }, // Red
    "Verwood": { bg: "#22D3EE", text: "#083344" }, // Cyan
    "Dorset": { bg: "#E5E7EB", text: "#1F2937" } // Gray
};

export default function MapView({ events }: MapViewProps) {
    // Group events by town
    const townCounts = useMemo(() => {
        const counts: Record<string, number> = {};

        events.forEach(event => {
            const town = getLocalityFromPostcode(event.postcode);
            counts[town] = (counts[town] || 0) + 1;
        });

        // Convert to array and sort by count descending
        return Object.entries(counts)
            .map(([town, count]) => ({ town, count }))
            .sort((a, b) => b.count - a.count);
    }, [events]);

    if (townCounts.length === 0) {
        return (
            <div className="empty-state">
                <h2>No events to map</h2>
                <p>Try adjusting your filters.</p>
            </div>
        );
    }

    return (
        <div className="map-view-container">
            <h2 className="map-view-title">Events by Region</h2>
            <p className="map-view-subtitle">Select a region to see dedicated local listings.</p>
            
            <div className="map-grid">
                {townCounts.map(({ town, count }) => {
                    const colors = TOWN_COLORS[town] || TOWN_COLORS["Dorset"];
                    // Convert town string to slug for the URL (e.g. "New Milton" -> "new-milton")
                    const slug = town.toLowerCase().replace(/\s+/g, '-');
                    
                    return (
                        <Link 
                            key={town} 
                            href={`/whats-on/${slug}`}
                            className="map-region-card"
                            style={{ 
                                backgroundColor: colors.bg, 
                                color: colors.text 
                            }}
                        >
                            <div className="map-region-content">
                                <h3 className="map-region-name">{town}</h3>
                                <div className="map-region-count">
                                    <span className="count-number">{count}</span>
                                    <span className="count-label">{count === 1 ? 'Event' : 'Events'}</span>
                                </div>
                            </div>
                            <div className="map-region-arrow">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
