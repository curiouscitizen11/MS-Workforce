import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services",
  description:
    "General construction labour, site support, and flexible or project-based cover. White card is the baseline. Heights, confined space, asbestos and scaffold work only with the right ticket.",
};

const covers = [
  {
    kicker: "01",
    title: "General construction labour",
    body: "Workers for general construction tasks. People who follow the site rules and the induction.",
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

const tickets = [
  {
    name: "White card",
    note: "Expected. We record the number and the expiry. This is the baseline.",
  },
  { name: "Work at heights", note: "Recorded." },
  { name: "Asbestos class A", note: "Recorded." },
  { name: "Asbestos class B", note: "Recorded." },
  { name: "Confined space", note: "Recorded." },
  { name: "Driver licence", note: "Recorded." },
  { name: "First aid", note: "Recorded." },
];

export default function ServicesPage() {
  return (
    <>
      <section className="flex min-h-[100svh] items-center bg-navy text-white">
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
          className={`flex min-h-[100svh] items-center ${
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

      <section className="flex min-h-[100svh] items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Tickets</p>
          <h2 className="display mt-6">The ticket decides the work.</h2>
          <ul className="mt-14 max-w-3xl border-b border-white/15">
            {tickets.map((item) => (
              <li key={item.name} className="stack-row border-t border-white/15">
                <h3 className="text-xl font-semibold tracking-tight sm:col-span-5 sm:text-2xl">
                  {item.name}
                </h3>
                <p className="text-base leading-relaxed text-white/70 sm:col-span-7">
                  {item.note}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-12 max-w-2xl space-y-6 text-lg leading-relaxed text-white/75">
            <p>
              Work at heights only goes to someone with a work at heights
              ticket. Confined space work only goes to someone with a confined
              space ticket. Asbestos work only goes to someone with the matching
              asbestos class ticket. Scaffold work only goes to a ticketed
              scaffolder.
            </p>
            <p>
              We do not offer demolition or asbestos removal as a general
              service. We only put someone forward for that work when they hold
              the ticket. Holding the ticket is the condition. It is not a claim
              that those people are already on our books.
            </p>
          </div>
          <div className="mt-12">
            <Link href="/contact" className="pill pill-light">
              Email what you need
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
