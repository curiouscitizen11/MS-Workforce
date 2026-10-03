import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "MS Workforce is a new construction labour hire business in Queenscliff, NSW 2096. Greater Sydney, with first jobs in NSW. Safety, reliability, respect, and straightforward.",
};

const values = [
  {
    title: "Safety",
    body: "Everyone deserves to go home safe. Inductions and safe work practices matter.",
  },
  {
    title: "Reliability",
    body: "Turning up and doing what we say we will do.",
  },
  {
    title: "Respect",
    body: "Fair treatment for clients and workers alike.",
  },
  {
    title: "Straightforward",
    body: "Clear, honest communication without unnecessary complications.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">About</p>
          <h1 className="display mt-6">Based in Queenscliff.</h1>
          <div className="mt-8 max-w-2xl space-y-6 text-lg leading-relaxed text-white/75 sm:text-xl">
            <p>
              MS Workforce is a construction labour hire business. The home
              office is in Queenscliff, NSW 2096, on Sydney&apos;s Northern
              Beaches.
            </p>
            <p>
              We can supply labour across Greater Sydney. First jobs are in NSW
              only.
            </p>
            <p>
              We are just getting started. The focus is doing the basics well:
              the right ticket, a proper induction, and plain communication.
            </p>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">Values</p>
          <h2 className="display mt-6">Safety, reliability, respect, straightforward.</h2>
          <ul className="mt-14 border-b border-navy/10">
            {values.map((item) => (
              <li key={item.title} className="stack-row border-t border-navy/10">
                <h3 className="text-2xl font-semibold tracking-tight sm:col-span-4 sm:text-3xl">
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed text-navy/70 sm:col-span-8 sm:text-lg">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-12">
            <Link href="/contact" className="pill pill-dark">
              Contact
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
