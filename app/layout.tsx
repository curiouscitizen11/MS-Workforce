import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EMAIL, JOBS_EMAIL, SITE_NAME, SITE_URL, OG_BASE } from "@/components/site";
import StickyCta from "@/components/StickyCta";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const description =
  "Construction labour hire for Greater Sydney builders. General labourers, trade assistants and site cleans, from one day to a whole project.";

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
    images: OG_BASE.images,
  },
  twitter: {
    card: "summary_large_image",
    title: "Construction Labour Hire Sydney | MS Workforce",
    description,
    images: ["/opengraph-image"],
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
  logo: SITE_URL + "/icon",
  image: SITE_URL + "/opengraph-image",
  areaServed: [
    { "@type": "City", name: "Sydney" },
  ],
  contactPoint: [
    { "@type": "ContactPoint", contactType: "sales", email: EMAIL, areaServed: "AU", availableLanguage: "en-AU" },
    { "@type": "ContactPoint", contactType: "recruitment", email: JOBS_EMAIL, areaServed: "AU", availableLanguage: "en-AU" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body className={inter.className + " bg-tint text-navy antialiased"}>
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
        <StickyCta />
      </body>
    </html>
  );
}
