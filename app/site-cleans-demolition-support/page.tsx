import type { Metadata } from "next";
import Link from "next/link";
import { BOOK_LABOUR_URL, REQUEST_LABOUR_HREF, socialMeta } from "@/components/site";

const pageTitle = "Site Cleans and Demolition Support | MS Workforce";
const pageDescription =
  "Labour for site cleans, soft strip-out support, debris carry-out, skip loading and handover tidy-ups, supervised by your builder. Book labour online.";

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  alternates: { canonical: "/site-cleans-demolition-support" },
  ...socialMeta("/site-cleans-demolition-support", pageTitle, pageDescription),
};

const cleans = [
  "Progressive cleans through the build",
  "Builders cleans and tidy-up at handover",
  "Rubbish removal and skip loading",
  "Keeping access and work areas clear",
];

const demolition = [
  "Soft strip-out support, working under your direction",
  "Carrying out and loading debris",
  "Skip loading as the skips fill",
  "Keeping access and work areas clear while the work goes on",
  "Protection and set-up help before work starts",
  "Tidy-up at handover",
];

const steps = [
  {
    title: "Send the brief",
    body: "Use the Book labour form or email the site, start time, the clean or clearing work needed, numbers and how long you need them.",
  },
  {
    title: "We match and confirm",
    body: "We match workers we have screened ourselves to the job and confirm PPE, access and site requirements with you before the start.",
  },
  {
    title: "Crew on site",
    body: "Your site team directs the work. You get one weekly invoice based on approved hours.",
  },
];

export default function SiteCleansPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">Site cleans and demolition support</p>
          <h1 className="display mt-4">Site cleans and demolition support for Sydney builders.</h1>
          <p className="lede mt-5 text-body">
            MS Workforce supplies labourers for site cleans and demolition
            support across Greater Sydney. Labour only, supervised by your
            builder. Book a single day or a crew for the whole stage.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={BOOK_LABOUR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pill pill-teal w-full sm:w-auto"
            >
              Book labour
              <span className="sr-only"> (form opens in a new tab)</span>
            </a>
            <a href={REQUEST_LABOUR_HREF} className="link-quiet link-quiet-light w-full sm:w-auto">
              Email the brief
            </a>
          </div>
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Site cleans</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
            A clean site is safer and keeps the trades moving. We supply
            labourers to keep it that way from the first week to handover.
          </p>
          <ul className="mt-6 max-w-2xl list-disc space-y-2 rounded-2xl border border-navy-line bg-navy-card py-5 pl-9 pr-5 text-base text-body marker:text-teal sm:text-lg">
            {cleans.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2 className="mt-10 text-3xl font-bold tracking-tight sm:text-4xl">Demolition support</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
            Extra hands for the manual side of demolition and strip-out, so
            your crew can stay on the main task. Your builder or site
            supervisor directs the work and the workers follow your site rules.
          </p>
          <ul className="mt-6 max-w-2xl list-disc space-y-2 rounded-2xl border border-navy-line bg-navy-card py-5 pl-9 pr-5 text-base text-body marker:text-teal sm:text-lg">
            {demolition.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
            This is labour only. We do not supply plant or run demolition
            jobs ourselves.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
            MS Workforce does not carry out asbestos removal itself, but can
            connect builders with a licensed asbestos removal contractor when
            a job needs it. Ask us through Book labour or Email the brief.
          </p>
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How booking works</h2>
          <ol className="mt-8 grid gap-3 sm:mt-10">
            {steps.map((step, index) => (
              <li key={step.title} className="num-card">
                <span className="num-badge">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{step.title}</h3>
                  <p className="mt-2 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
            Book one day, short-notice cover, ongoing supply or a
            project-based crew. If we can&apos;t fill a request properly, we
            say so rather than send the wrong person.
          </p>
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Need a hand on site?</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-body sm:text-lg">
            Send us the brief and we will tell you straight away whether we can fill it.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={BOOK_LABOUR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pill pill-teal w-full sm:w-auto"
            >
              Book labour
              <span className="sr-only"> (form opens in a new tab)</span>
            </a>
            <a href={REQUEST_LABOUR_HREF} className="link-quiet link-quiet-light w-full sm:w-auto">
              Email the brief
            </a>
            <Link href="/services" className="link-quiet link-quiet-light w-full sm:w-auto">
              See all services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
