import type { Metadata } from "next";
import Link from "next/link";
import { BOOK_LABOUR_URL, REQUEST_LABOUR_HREF, socialMeta } from "@/components/site";

const pageTitle = "Labourers in Sydney for Builders | MS Workforce";
const pageDescription =
  "General labourers and trade assistants for Sydney builders, booked for a day, as short-notice cover or for a whole project. Book labour with MS Workforce.";

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  alternates: { canonical: "/labourers-sydney" },
  ...socialMeta("/labourers-sydney", pageTitle, pageDescription),
};

const labourerWork = [
  "Site preparation and clean-up",
  "Loading and unloading",
  "Barrows and back-filling",
  "The everyday work that keeps a program on track",
];

const assistantWork = [
  "Fetching, cutting and mixing",
  "Carrying and setting up",
  "Support for carpenters, concreters, bricklayers, renderers and tilers",
];

const lengths = [
  { title: "Day labour", body: "A single day, booked when you need it." },
  { title: "Short-notice cover", body: "For no-shows, pours, deliveries and stages that run long." },
  { title: "Ongoing supply", body: "Regular labour, with the same workers returning wherever possible." },
  { title: "Project-based crews", body: "A crew sized to the stage and adjusted as the program moves." },
];

const steps = [
  {
    title: "Send the brief",
    body: "Use the Book labour form or email the site, start time, roles, numbers and how long you need them.",
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

export default function LabourersSydneyPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="wrap py-20 sm:py-28">
          <p className="kicker text-white/65">Labourers in Sydney</p>
          <h1 className="display mt-6">Labourers for Sydney building sites.</h1>
          <p className="lede mt-8 text-white/75">
            MS Workforce supplies general labourers and trade assistants to
            builders across Greater Sydney. Book one worker for a day, or a crew
            for the whole project.
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

      <section className="bg-tint text-navy">
        <div className="wrap py-16 sm:py-24">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">General labourers</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy/75 sm:text-lg">
            Reliable labour for the jobs that need extra hands on site.
          </p>
          <ul className="mt-6 max-w-2xl list-disc space-y-2 pl-5 text-base text-navy/80 sm:text-lg">
            {labourerWork.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2 className="mt-14 text-3xl font-semibold tracking-tight sm:text-4xl">Trade assistants</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy/75 sm:text-lg">
            Practical support so your trades stay productive.
          </p>
          <ul className="mt-6 max-w-2xl list-disc space-y-2 pl-5 text-base text-navy/80 sm:text-lg">
            {assistantWork.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="wrap py-16 sm:py-24">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            From one day to a whole project
          </h2>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-md bg-white/10 sm:grid-cols-2">
            {lengths.map((item) => (
              <li key={item.title} className="bg-navy p-6">
                <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-white/70">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-tint text-navy">
        <div className="wrap py-16 sm:py-24">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How booking works</h2>
          <ol className="mt-8 border-b border-navy/10">
            {steps.map((step, index) => (
              <li key={step.title} className="stack-row border-t border-navy/10">
                <span className="kicker text-navy/75 sm:col-span-2">0{index + 1}</span>
                <div className="sm:col-span-10">
                  <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{step.title}</h3>
                  <p className="mt-2 max-w-2xl text-base leading-relaxed text-navy/75 sm:text-lg">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-navy/75 sm:text-lg">
            If we can&apos;t fill a request properly, we say so rather than send
            the wrong person.
          </p>
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="wrap py-16 sm:py-24">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Need labour on site?</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
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
            <Link href="/services" className="link-quiet link-quiet-light w-full sm:w-auto">
              See all services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
