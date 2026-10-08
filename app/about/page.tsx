import type { Metadata } from "next";
import { REQUEST_LABOUR_HREF } from "@/components/site";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About MS Workforce",
  description:
    "MS Workforce is a construction labour hire business based on Sydney's Northern Beaches, supplying general labourers, trade assistants and site support to builders across Greater Sydney.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About MS Workforce",
    description:
      "A focused construction labour hire business based on Sydney's Northern Beaches, supplying builders across Greater Sydney.",
    url: "/about",
  },
};

const values = [
  {
    title: "Safety",
    body: "Every worker goes home safe. We confirm site requirements before every start and act on concerns straight away.",
  },
  {
    title: "Reliability",
    body: "On site, on time, ready to work. If we cannot fill a request properly, we say so.",
  },
  {
    title: "Respect",
    body: "Fair treatment and correct pay for workers. Clear, honest dealings with builders.",
  },
  {
    title: "Straightforward",
    body: "Plain answers, written rates, one weekly invoice. No fine print and no runaround.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">About</p>
          <h1 className="display mt-6">Focused on construction labour. Nothing else.</h1>
          <div className="mt-8 max-w-2xl space-y-6 text-lg leading-relaxed text-white/75 sm:text-xl">
            <p>
              MS Workforce is a construction labour hire business based on
              Sydney&apos;s Northern Beaches. We supply general labourers, trade
              assistants and site support crews to builders and trades across
              Greater Sydney.
            </p>
            <p>
              We keep the offer deliberately focused. That means we know the
              work, we know the people we send, and builders deal directly with
              the owner rather than a call centre.
            </p>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">How we work</p>
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
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <a href={REQUEST_LABOUR_HREF} className="pill pill-dark w-full sm:w-auto">
              Request labour
            </a>
            <Link href="/contact" className="pill pill-line-dark w-full sm:w-auto">
              Contact
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
