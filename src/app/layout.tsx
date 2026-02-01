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
    default: "BH Culture Calendar | Art, Theatre & Comedy in Bournemouth, Christchurch & Poole",
    template: "%s | BH Culture Calendar"
  },
  description: "The ultimate guide to culture in the BH postcode area. Find art exhibitions, comedy, dance, festivals, film, spoken word, and theatre events in Bournemouth, Christchurch, and Poole.",
  keywords: ["bournemouth events", "poole culture", "christchurch whats on", "theatre bh", "art exhibitions bournemouth", "comedy poole", "festivals dorset"],
  openGraph: {
    title: "BH Culture Calendar",
    description: "Discover art, comedy, dance, festivals, film, and theatre in the BH postcode area.",
    url: 'https://bhculturecalendar.co.uk',
    siteName: 'BH Culture Calendar',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "BH Culture Calendar",
    description: "Your guide to culture in the BH postcode area.",
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
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
