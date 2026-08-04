"use client";

interface FilterBarProps {
    categories: string[];
    categoryCounts: Record<string, number>;
    selectedCategory: string | null;
    onCategoryChange: (category: string | null) => void;
    selectedLocation: string | null;
    onLocationChange: (location: string | null) => void;
    viewMode: "grid" | "calendar";
    onViewModeChange: (mode: "grid" | "calendar") => void;
    showTonight: boolean;
    onShowTonightChange: (value: boolean) => void;
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
    categoryCounts,
    selectedCategory,
    onCategoryChange,
    selectedLocation,
    onLocationChange,
    viewMode,
    onViewModeChange,
    showTonight,
    onShowTonightChange,
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
                <span className="filter-label search-label">SEARCH:</span>
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
                <span className="filter-label">WHAT:</span>
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
                            {cat} <span style={{ opacity: 0.6, fontSize: "0.85em", marginLeft: "4px" }}>({categoryCounts[cat] || 0})</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <span className="filter-label">WHERE:</span>
                <select 
                    className="filter-btn select-filter" 
                    value={selectedLocation || ""} 
                    onChange={(e) => onLocationChange(e.target.value || null)}
                    style={{ width: "100%", cursor: "pointer" }}
                >
                    <option value="">All Locations</option>
                    <option value="bournemouth">Bournemouth</option>
                    <option value="poole">Poole</option>
                    <option value="christchurch">Christchurch</option>
                    <option value="swanage">Swanage</option>
                    <option value="wareham">Wareham</option>
                    <option value="wimborne">Wimborne</option>
                    <option value="ferndown">Ferndown</option>
                    <option value="ringwood">Ringwood</option>
                    <option value="new-milton">New Milton</option>
                    <option value="verwood">Verwood</option>
                    <option value="dorset">Dorset (Other)</option>
                </select>
            </div>

            <div className="filter-section">
                <span className="filter-label">WHEN:</span>
                <div className="filter-buttons">
                    <label className={`filter-btn checkbox-btn ${showTonight ? "active" : ""}`}>
                        <input
                            type="checkbox"
                            checked={showTonight}
                            onChange={(e) => onShowTonightChange(e.target.checked)}
                            className="hidden-checkbox"
                        />
                        Tonight
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
                </div>
            </div>

            <div className="filter-section">
                <span className="filter-label">COST:</span>
                <div className="filter-buttons">
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
