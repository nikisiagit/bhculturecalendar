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
  title: "BH Culture Calendar",
  description: "Art, comedy, dance, festival, film, spoken word and theatre in the BH postcode area",
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
