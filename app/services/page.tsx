import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services",
  description:
    "General construction labour, site support, and flexible or project-based cover from MS Workforce, a new construction labour hire business.",
};

const covers = [
  {
    kicker: "01",
    title: "General construction labour",
    body: "Workers for general construction tasks on site.",
    dark: false,
  },
  {
    kicker: "02",
    title: "Site support",
    body: "General site duties and cleaning, and other day-to-day support on a construction site.",
    dark: true,
  },
  {
    kicker: "03",
    title: "Flexible or project-based cover",
    body: "Workers for a set period, or for a particular piece of work, when a site needs more hands for a time.",
    dark: false,
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Services</p>
          <h1 className="display mt-6">Three kinds of cover.</h1>
          <p className="lede mt-8 text-white/75">
            MS Workforce supplies construction workers. That is general
            construction labour, site support, and flexible or project-based
            cover. We are new, and the work starts with getting those basics
            right.
          </p>
        </div>
      </section>

      {covers.map((item) => (
        <section
          key={item.title}
          className={`flex screen items-center ${
            item.dark ? "bg-navy text-white" : "bg-white text-navy"
          }`}
        >
          <div className="wrap py-24 sm:py-28">
            <p className={`kicker ${item.dark ? "text-white/50" : "text-navy/45"}`}>
              {item.kicker}
            </p>
            <h2 className="display mt-6">{item.title}</h2>
            <p className={`lede mt-8 ${item.dark ? "text-white/75" : "text-navy/70"}`}>
              {item.body}
            </p>
          </div>
        </section>
      ))}

      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Ask</p>
          <h2 className="display mt-6">Email what you need.</h2>
          <p className="lede mt-8 text-white/75">
            Tell us the role, the place and the timing. A short email is
            enough.
          </p>
          <div className="mt-10">
            <Link href="/contact" className="pill pill-light">
              Email what you need
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
