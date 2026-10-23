import Link from "next/link";
import { REQUEST_LABOUR_HREF, BOOK_LABOUR_URL } from "@/components/site";

const roles = [
  {
    title: "General labourers",
    body: "Site preparation, clean-up, loading and unloading, and the day-to-day work that keeps a build moving.",
  },
  {
    title: "Trade assistants",
    body: "Hands-on support for carpenters, concreters, bricklayers and other trades, so your trades stay on the tools.",
  },
  {
    title: "Site cleans and site support",
    body: "Progressive and handover cleans, rubbish removal, keeping access ways clear and the site tidy.",
  },
  {
    title: "Materials handling",
    body: "Deliveries, stacking and distribution of materials around the site and between floors.",
  },
];

const supply = [
  { title: "Day labour", body: "One worker for one day when the job needs an extra pair of hands." },
  { title: "Short-notice cover", body: "Cover for a no-show, a pour, a delivery or a stage that has run long." },
  { title: "Ongoing supply", body: "The same reliable faces on your site, week after week." },
  { title: "Project-based crews", body: "A crew sized to the stage, scaled up or down as the program changes." },
];

const steps = [
  {
    title: "Book labour",
    body: "Fill in the Book labour form or email the brief: site, start time, roles, numbers and how long you need them.",
  },
  {
    title: "We match and confirm",
    body: "We match workers we have screened ourselves to the job and confirm PPE, access and site requirements with you before the start.",
  },
  {
    title: "Crew on site",
    body: "Workers arrive briefed on the site, the start time and who to report to. Your site team directs the work, and you get one weekly invoice on approved hours.",
  },
];

const standards = [
  "Site requirements confirmed before every start.",
  "Straight answers on availability. We say no rather than send the wrong person.",
  "One point of contact from the first request to the last day on site.",
  "Correct pay and super for every worker we supply.",
];

export default function HomePage() {
  return (
    <>
      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-20 sm:py-28 lg:py-32">
          <p className="kicker text-white/65">Construction labour hire · Greater Sydney</p>
          <h1 className="display mt-6">Construction labour, on site when you need them.</h1>
          <p className="lede mt-8 text-white/75">
            MS Workforce supplies general labourers, trade assistants and site
            support crews to builders across Greater Sydney. From a single day
            of labour to a crew for the whole stage.
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
            <a href={REQUEST_LABOUR_HREF} className="pill pill-line w-full sm:w-auto">
              Email the brief
            </a>
            <Link href="/candidates" className="pill pill-line w-full sm:w-auto">
              Find work
            </Link>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-tint text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/75">What we supply</p>
          <h2 className="display mt-6">Labour for every stage of the build.</h2>
          <ul className="mt-14 border-b border-navy/10">
            {roles.map((item, index) => (
              <li key={item.title} className="stack-row border-t border-navy/10">
                <span className="kicker text-navy/75 sm:col-span-3">0{index + 1}</span>
                <div className="sm:col-span-9">
                  <h3 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-base leading-relaxed text-navy/75 sm:text-lg">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-12">
            <Link href="/services" className="pill pill-line-dark">
              All services
            </Link>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/65">Ways to book</p>
          <h2 className="display mt-6">From one day to the whole job.</h2>
          <ul className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2">
            {supply.map((item) => (
              <li key={item.title} className="bg-navy p-6 sm:p-8">
                <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-white/70 sm:text-lg">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex screen items-center bg-tint text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/75">How it works</p>
          <h2 className="display mt-6">Three steps. Brief in, crew on site.</h2>
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="group rounded-3xl border border-navy/10 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-teal-600/40 hover:shadow-lg motion-reduce:transform-none sm:p-8"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">{step.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-navy/75 sm:text-lg">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <a
              href={BOOK_LABOUR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pill pill-teal w-full sm:w-auto"
            >
              Book labour
              <span className="sr-only"> (form opens in a new tab)</span>
            </a>
            <Link href="/clients" className="pill pill-line-dark w-full sm:w-auto">
              Builders FAQ
            </Link>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/65">Our standard</p>
          <h2 className="display mt-6">The same standard on every start.</h2>
          <ul className="mt-14 border-b border-white/10">
            {standards.map((item) => (
              <li key={item} className="flex gap-5 border-t border-white/10 py-6 sm:py-8">
                <span aria-hidden="true" className="mt-3 h-2 w-2 flex-none rounded-full bg-teal" />
                <p className="text-xl font-medium leading-snug tracking-tight sm:text-3xl">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex screen items-center bg-tint text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/75">Where we work</p>
          <h2 className="display mt-6">Construction labour across Sydney.</h2>
          <p className="lede mt-8 text-navy/75">
            We supply construction labour to building sites across Sydney,
            from the CBD and the suburbs to Western Sydney.
          </p>
        </div>
      </section>

      <section className="grid screen grid-rows-2 bg-navy text-white md:grid-cols-2 md:grid-rows-1">
        <a
          href={BOOK_LABOUR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center justify-center text-center border-b transition-colors hover:bg-white/[0.03] border-white/10 px-5 py-16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-teal sm:px-10 md:border-b-0 md:border-r"
        >
          <p className="kicker text-white/65">For builders</p>
          <h2 className="mx-auto mt-4 max-w-lg text-balance text-3xl font-semibold tracking-tight sm:text-[2.5rem] sm:leading-[1.1]">
            Need labour on site? Send us the brief.
          </h2>
          <span className="mt-8 text-sm font-medium text-teal-300 transition group-hover:translate-x-1">Book labour →<span className="sr-only"> (form opens in a new tab)</span></span>
        </a>
        <Link
          href="/candidates"
          className="group flex flex-col items-center justify-center text-center px-5 transition-colors hover:bg-white/[0.03] py-16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-teal sm:px-10"
        >
          <p className="kicker text-white/65">For workers</p>
          <h2 className="mx-auto mt-4 max-w-lg text-balance text-3xl font-semibold tracking-tight sm:text-[2.5rem] sm:leading-[1.1]">
            Looking for construction work in Sydney? Register with us.
          </h2>
          <span className="mt-8 text-sm font-medium text-teal-300 transition group-hover:translate-x-1">Find work →</span>
        </Link>
      </section>
    </>
  );
}
