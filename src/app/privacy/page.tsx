import fs from "fs";
import path from "path";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { fetchEvents } from "@/lib/api-events";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { filterUpcomingEvents } from "@/lib/event-time";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy – BH Culture Calendar" },
  description:
    "Privacy policy for the BH Culture Calendar iPhone app and bhculturecalendar.co.uk.",
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
};

function loadPrivacyMarkdown(): string {
  return fs.readFileSync(
    path.join(process.cwd(), "src/content/privacy-policy.md"),
    "utf8"
  );
}

export default async function PrivacyPage() {
  const events = filterUpcomingEvents(await fetchEvents());
  const markdown = loadPrivacyMarkdown();

  return (
    <>
      <Header events={events} />
      <main className="main seo-landing privacy-page">
        <article className="privacy-article">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="page-title seo-h1">{children}</h1>,
              h2: ({ children }) => <h2 className="seo-section-title">{children}</h2>,
              p: ({ children }) => <p className="seo-body">{children}</p>,
              ul: ({ children }) => <ul className="privacy-list">{children}</ul>,
              li: ({ children }) => <li>{children}</li>,
              strong: ({ children }) => <strong>{children}</strong>,
              a: ({ href, children }) => (
                <a href={href} rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
