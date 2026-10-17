import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were after has moved or never existed.",
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <section className="flex screen items-center bg-navy text-white">
      <div className="wrap py-24 sm:py-28">
        <p className="kicker text-white/65">404</p>
        <h1 className="display mt-6">This page isn&apos;t on site.</h1>
        <p className="lede mt-8 text-white/75">
          The page you were after has moved or never existed. Try one of these
          instead.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="pill pill-teal w-full sm:w-auto">
            Home
          </Link>
          <Link href="/clients" className="pill pill-line w-full sm:w-auto">
            For builders
          </Link>
          <Link href="/candidates" className="pill pill-line w-full sm:w-auto">
            Find work
          </Link>
        </div>
      </div>
    </section>
  );
}
