import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "MS Workforce | Construction labour hire",
    template: "%s | MS Workforce",
  },
  description:
    "MS Workforce is a new construction labour hire business. Home office in Queenscliff, NSW 2096. We can supply labour across Greater Sydney. First jobs are in NSW.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body className={`${inter.className} bg-white text-navy antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
