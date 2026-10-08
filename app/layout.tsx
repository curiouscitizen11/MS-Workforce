import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EMAIL, SITE_NAME, SITE_URL } from "@/components/site";

const inter = Inter({ subsets: ["latin"] });

const description =
  "Construction labour hire across Greater Sydney. MS Workforce supplies general labourers, trade assistants and site support crews to builders, from day labour and short-notice cover to ongoing, project-based supply. Based on the Northern Beaches.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Construction Labour Hire Sydney | MS Workforce",
    template: "%s | MS Workforce",
  },
  description,
  applicationName: SITE_NAME,
  keywords: [
    "construction labour hire Sydney",
    "labour hire Northern Beaches",
    "general labourers Sydney",
    "trade assistants Sydney",
    "site cleans",
    "day labour Sydney",
    "builders labour hire",
    "Greater Sydney labour hire",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Construction Labour Hire Sydney | MS Workforce",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Construction Labour Hire Sydney | MS Workforce",
    description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0A2540",
};

const organisation = {
  "@context": "https://schema.org",
  "@type": "EmploymentAgency",
  name: SITE_NAME,
  url: SITE_URL,
  email: EMAIL,
  description,
  areaServed: { "@type": "City", name: "Sydney" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Northern Beaches",
    addressRegion: "NSW",
    addressCountry: "AU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body className={inter.className + " bg-white text-navy antialiased"}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }}
        />
        <Header />
        <main
          className="relative z-0"
          style={{ paddingTop: "var(--site-header-height)" }}
        >
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
