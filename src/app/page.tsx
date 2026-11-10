import Link from "next/link";
import type { Metadata } from "next";

/**
 * Fallback only. Production serves a 308 via public/_redirects (Cloudflare Pages).
 * Do not call redirect() here — with output:'export' it streams an __next_error__
 * shell (HTTP 200) that Google indexes as an empty homepage.
 */
export const metadata: Metadata = {
  title: "What's On in Bournemouth, Poole & Christchurch",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://bhculturecalendar.co.uk/whats-on",
  },
};

export default function Home() {
  return (
    <main className="main" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
      <h1 className="page-title" style={{ marginBottom: "1rem" }}>
        BH Culture Calendar
      </h1>
      <p style={{ marginBottom: "1.5rem" }}>
        What&apos;s on has moved to{" "}
        <Link href="/whats-on" style={{ textDecoration: "underline" }}>
          /whats-on
        </Link>
        .
      </p>
      <p>
        <Link href="/whats-on" className="seo-primary-btn">
          Browse what&apos;s on
        </Link>
      </p>
    </main>
  );
}
