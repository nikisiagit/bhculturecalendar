import type { Metadata } from "next";
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
  metadataBase: new URL("https://bhculturecalendar.co.uk"),
  title: {
    default: "What's On in Bournemouth, Poole & Christchurch This Week",
    // Pages set absolute titles; avoid appending a long brand suffix.
    template: "%s",
  },
  description:
    "Find theatre, art, comedy and festivals in Bournemouth, Christchurch and Poole. Updated what's on for the BCP / BH postcode area.",
  alternates: {
    canonical: "https://bhculturecalendar.co.uk/whats-on",
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
    "bh postcode culture",
  ],
  openGraph: {
    title: "What's On in Bournemouth, Poole & Christchurch This Week",
    description:
      "Theatre, art, comedy and festivals in the BH postcode area. Plan your week with BH Culture Calendar.",
    url: "https://bhculturecalendar.co.uk/whats-on",
    siteName: "BH Culture Calendar",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "What's On in Bournemouth, Poole & Christchurch This Week",
    description: "Your guide to culture, theatre and events in the BH postcode area.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
