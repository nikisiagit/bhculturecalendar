# SEO Recommendations & Implementation Plan

## 1. Gap Analysis Review
Your site covers general "culture" well, but lacks specific landing pages for high-intent keywords.
**Identified Gaps:**
- **Specific Activity Pages**: Users search for "Theatre in Bournemouth" or "Art Galleries Poole". Currently, these all direct to the homepage.
    - *Critical Technical Gap*: The current homepage uses client-side state for filtering (e.g., clicking "Theatre" doesn't change the URL). Google cannot index a "Theatre" specific view.
    - *Recommendation*: Implement URL query parameters (e.g., `/?category=Theatre`) or dynamic routes (`/events/theatre`) so these filtered views can be indexed (and shared!).
- **Venue-Specific Content**: While you have a venues list, individual venue pages with their upcoming events would capture traffic like "Regent Centre listings".
- **Seasonal Content**: "Summer 2026 events" or "Christmas 2026 Bournemouth" are high value.

## 2. "People Also Ask" Blog Topics
To build topical authority for BCP events, consider creating these blog posts (or content sections):

### Topic 1: "Top 10 Family-Friendly Events in Bournemouth for 2026"
*   **Target Keywords**: family things to do bournemouth, kids events 2026, free family events bcp.
*   **Why**: High volume search intent involves planning for families.
*   **Content**: List upcoming festivals, workshops, and outdoor theatre suitable for children.

### Topic 2: "The Ultimate Guide to Art Exhibitions in Poole: Hidden Gems & Galleries"
*   **Target Keywords**: art exhibitions poole, poole galleries, local artists dorset.
*   **Why**: Specifically targets the "art exhibitions Poole" gap we identified.
*   **Content**: Feature Lighthouse Poole, Poole Museum, and smaller independent galleries.

### Topic 3: "Theatre in Christchurch: What's On at the Regent Centre & Beyond"
*   **Target Keywords**: theatre shows christchurch, regent centre listings, live performance bcp.
*   **Why**: Christchurch is often overshadowed; targeting it specifically builds local trust.
*   **Content**: Focus on the Regent Centre and smaller community theatre productions.

## 3. JSON-LD Event Schema Template
Use this template for individual event pages to help them appear in Google's Event Snippets.
Note: Ensure you populate the variables (e.g., `EVENT_TITLE`) dynamically.

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "EVENT_TITLE",
  "description": "EVENT_DESCRIPTION",
  "startDate": "2026-05-21T19:00",
  "endDate": "2026-05-21T22:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "VENUE_NAME",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "VENUE_STREET",
      "addressLocality": "Bournemouth",
      "postalCode": "BH1 1AA",
      "addressRegion": "Dorset",
      "addressCountry": "UK"
    }
  },
  "image": [
    "https://bhculturecalendar.co.uk/images/event-image-1x1.jpg",
    "https://bhculturecalendar.co.uk/images/event-image-4x3.jpg",
    "https://bhculturecalendar.co.uk/images/event-image-16x9.jpg"
  ],
  "organizer": {
    "@type": "Organization",
    "name": "ORGANIZER_NAME",
    "url": "https://organizer-website.com"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://bhculturecalendar.co.uk/event/event-slug",
    "price": "25.00",
    "priceCurrency": "GBP",
    "availability": "https://schema.org/InStock",
    "validFrom": "2025-12-01T09:00"
  },
  "performer": {
    "@type": "PerformingGroup",
    "name": "PERFORMER_NAME"
  }
}
</script>
```

## 4. Mobile-First & Technical Notes
- **Readability**: Ensure all body text is at least 16px to avoid "text too small to read" errors in Search Console.
- **Tap Targets**: Make sure 'Book Now' and 'More Info' buttons differ visually and have sufficient padding (at least 48x48px touch area).
- **Speed**: Continue using Next.js Image optimization (`next/image`) as you are doing.
