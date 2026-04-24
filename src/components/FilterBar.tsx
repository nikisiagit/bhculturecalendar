"use client";

interface FilterBarProps {
    categories: string[];
    selectedCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    viewMode: "grid" | "calendar" | "map";
    onViewModeChange: (mode: "grid" | "calendar" | "map") => void;
    showToday: boolean;
    onShowTodayChange: (value: boolean) => void;
    showTomorrow: boolean;
    onShowTomorrowChange: (value: boolean) => void;
    showWeekend: boolean;
    onShowWeekendChange: (value: boolean) => void;
    showFreeOnly: boolean;
    onShowFreeOnlyChange: (value: boolean) => void;
    searchQuery: string;
    onSearchChange: (value: string) => void;
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
    searchQuery,
    onSearchChange,
}: FilterBarProps) {
    return (
        <div className="filter-bar">
            {/* Search Section */}
            <div className="filter-section search-section">
                <span className="filter-label search-label">Search:</span>
                <div className="search-input-wrapper">
                    <input
                        type="text"
                        className="filter-input"
                        placeholder="Search by event name"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        aria-label="Search events by title"
                    />
                </div>
            </div>

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
                <button
                    className={`view-btn ${viewMode === "map" ? "active" : ""}`}
                    onClick={() => onViewModeChange("map")}
                    aria-label="Map view"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}
