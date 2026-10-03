import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For clients",
  description:
    "Tell us the role, place and timing. We match someone who is available, and stay in contact. MS Workforce is new.",
};

const steps = [
  {
    title: "Tell us the role, place and timing",
    body: "Email the role, where the site is, and when you need someone.",
  },
  {
    title: "We match someone who is available",
    body: "We match someone who is available for that work.",
  },
  {
    title: "We stay in contact",
    body: "We stay in contact with you and with the worker while the placement is on.",
  },
];

export default function ClientsPage() {
  return (
    <>
      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Clients</p>
          <h1 className="display mt-6">Workers for your site.</h1>
          <p className="lede mt-8 text-white/75">
            We are new. Trust is earned by doing the basics properly, not by
            talking them up. There is no pressure to go ahead.
          </p>
          <div className="mt-10">
            <Link href="/contact" className="pill pill-light">
              Email us
            </Link>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">How it works</p>
          <h2 className="display mt-6">How a placement works.</h2>
          <ol className="mt-14 border-b border-navy/10">
            {steps.map((step, index) => (
              <li key={step.title} className="stack-row border-t border-navy/10">
                <span className="kicker text-navy/40 sm:col-span-2">
                  0{index + 1}
                </span>
                <div className="sm:col-span-10">
                  <h3 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy/70 sm:text-lg">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="lede mt-12 text-navy/70">
            If you want to talk it through, email{" "}
            <a className="text-teal" href="mailto:smoranc.marek@gmail.com">
              smoranc.marek@gmail.com
            </a>
            . A straightforward note is enough.
          </p>
        </div>
      </section>
    </>
  );
}
