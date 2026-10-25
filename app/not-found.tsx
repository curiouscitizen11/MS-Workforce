import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="bg-navy text-white">
      <div className="wrap py-14 sm:py-20 lg:py-24">
        <p className="kicker text-teal">404</p>
        <h1 className="display mt-4">This page isn&apos;t on site.</h1>
        <p className="lede mt-5 text-body">
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
            Apply for work
          </Link>
        </div>
      </div>
    </section>
  );
}
