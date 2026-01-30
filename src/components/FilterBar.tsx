"use client";

import { useState } from "react";

interface FilterBarProps {
    categories: string[];
    selectedCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    viewMode: "grid" | "calendar";
    onViewModeChange: (mode: "grid" | "calendar") => void;
    showToday: boolean;
    onShowTodayChange: (value: boolean) => void;
    showTomorrow: boolean;
    onShowTomorrowChange: (value: boolean) => void;
    showWeekend: boolean;
    onShowWeekendChange: (value: boolean) => void;
    showFreeOnly: boolean;
    onShowFreeOnlyChange: (value: boolean) => void;
}

export default function FilterBar({
    categories,
    selectedCategory,
    onCategoryChange,
    viewMode,
    onViewModeChange,
    showToday,
    onShowTodayChange,
    showTomorrow,
    onShowTomorrowChange,
    showWeekend,
    onShowWeekendChange,
    showFreeOnly,
    onShowFreeOnlyChange,
}: FilterBarProps) {
    return (
        <div className="filter-bar">
            <div className="filter-section">
                <span className="filter-label">Filter by:</span>
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${selectedCategory === null ? "active" : ""}`}
                        onClick={() => onCategoryChange(null)}
                    >
                        All Events
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
                            onClick={() => onCategoryChange(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <span className="filter-label">Filters:</span>
                <div className="filter-buttons">
                    <label className={`filter-btn checkbox-btn ${showToday ? "active" : ""}`}>
                        <input
                            type="checkbox"
                            checked={showToday}
                            onChange={(e) => onShowTodayChange(e.target.checked)}
                            className="hidden-checkbox"
                        />
                        Today
                    </label>
                    <label className={`filter-btn checkbox-btn ${showTomorrow ? "active" : ""}`}>
                        <input
                            type="checkbox"
                            checked={showTomorrow}
                            onChange={(e) => onShowTomorrowChange(e.target.checked)}
                            className="hidden-checkbox"
                        />
                        Tomorrow
                    </label>
                    <label className={`filter-btn checkbox-btn ${showWeekend ? "active" : ""}`}>
                        <input
                            type="checkbox"
                            checked={showWeekend}
                            onChange={(e) => onShowWeekendChange(e.target.checked)}
                            className="hidden-checkbox"
                        />
                        This Weekend
                    </label>
                    <label className={`filter-btn checkbox-btn ${showFreeOnly ? "active" : ""}`}>
                        <input
                            type="checkbox"
                            checked={showFreeOnly}
                            onChange={(e) => onShowFreeOnlyChange(e.target.checked)}
                            className="hidden-checkbox"
                        />
                        Free
                    </label>
                </div>
            </div>

            <div className="view-toggle">
                <button
                    className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => onViewModeChange("grid")}
                    aria-label="Grid view"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                    </svg>
                </button>
                <button
                    className={`view-btn ${viewMode === "calendar" ? "active" : ""}`}
                    onClick={() => onViewModeChange("calendar")}
                    aria-label="Calendar view"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7v-5z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
