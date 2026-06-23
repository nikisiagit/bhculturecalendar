import type { Metadata } from "next";
import Script from "next/script";
import { Archivo, Archivo_Black } from "next/font/google";
import "./globals.css";
import "./cookie-styles.css";
import CookieBanner from "@/components/CookieBanner";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-body",
});

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bhculturecalendar.co.uk'),
  title: {
    default: "What's On Bournemouth, Christchurch & Poole | 2026 Art, Theatre & Comedy Events",
    template: "%s | BH Culture Calendar"
  },
  description: "Discover the best 2026 events in Bournemouth, Christchurch, and Poole. Your ultimate guide to theatre shows, art exhibitions, comedy, and festivals in the BCP area (BH postcode).",
  alternates: {
    canonical: './',
  },
  keywords: [
    "what's on bournemouth 2026",
    "events in poole",
    "christchurch whats on",
    "theatre shows bournemouth",
    "art exhibitions poole",
    "comedy poole",
    "festivals dorset",
    "live music christchurch",
    "family things to do bournemouth",
    "bcp events",
    "bh postcode culture"
  ],
  openGraph: {
    title: "What's On in Bournemouth, Christchurch & Poole | BH Culture Calendar",
    description: "Discover art, comedy, dance, festivals, film, and theatre in the BH postcode area. Plan your 2026 with the best local events.",
    url: 'https://bhculturecalendar.co.uk',
    siteName: 'BH Culture Calendar',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "What's On in Bournemouth, Christchurch & Poole",
    description: "Your guide to 2026 culture, theatre, and events in the BH postcode area.",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body className={`${archivo.variable} ${archivoBlack.variable}`}>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "BH Culture Calendar",
              "url": "https://bhculturecalendar.co.uk",
              "logo": "https://bhculturecalendar.co.uk/icon.png",
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "bhculturecalendar@gmail.co.uk",
                "contactType": "customer support"
              }
            })
          }}
        />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
