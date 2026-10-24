import PhotoSection from "@/components/PhotoSection";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icons";
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

const steps: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "request",
    title: "Send your request",
    body: "Fill in the Book labour form or email the brief: site, start time, roles, numbers and how long you need them.",
  },
  {
    icon: "crew",
    title: "We match your crew",
    body: "We match workers we have screened ourselves to the job and confirm PPE, access and site requirements with you before the start.",
  },
  {
    icon: "hardhat",
    title: "They start on site",
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
        <div className="wrap py-14 sm:py-24 lg:py-28">
          <span aria-hidden="true" className="block h-1 w-12 rounded-full bg-teal" />
          <p className="kicker mt-6 text-teal">Construction labour hire · Greater Sydney</p>
          <h1 className="display mt-4">Construction labour, on site when you need them.</h1>
          <p className="lede mt-6 text-body">
            MS Workforce supplies general labourers, trade assistants and site
            support crews to builders across Greater Sydney. From a single day
            of labour to a crew for the whole stage.
          </p>
          <div className="mt-8 grid gap-6 sm:max-w-xl sm:grid-cols-2 sm:gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-white">Builders and site managers</p>
              <a
                href={BOOK_LABOUR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="pill pill-teal w-full"
              >
                Book labour
                <span className="sr-only"> (form opens in a new tab)</span>
              </a>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-white">Looking for work</p>
              <Link href="/candidates#register" className="pill pill-line w-full">
                Apply for work
              </Link>
            </div>
          </div>
          <p className="mt-4">
            <a href={REQUEST_LABOUR_HREF} className="link-quiet link-quiet-light -ml-2">
              Prefer email? Email the brief
            </a>
          </p>
        </div>
      </section>

      <section className="flex screen items-center bg-navy-alt text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-teal">What we supply</p>
          <h2 className="display mt-6">Labour for every stage of the build.</h2>
          <ul className="mt-8 grid gap-3 sm:mt-10">
            {roles.map((item, index) => (
              <li key={item.title} className="num-card">
                <span className="num-badge">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold tracking-tight sm:text-3xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-base leading-relaxed text-body sm:text-lg">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-12">
            <Link href="/services" className="pill pill-line">
              All services
            </Link>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-teal">Ways to book</p>
          <h2 className="display mt-6">From one day to the whole job.</h2>
          <ul className="mt-14 grid gap-3 sm:grid-cols-2">
            {supply.map((item) => (
              <li key={item.title} className="rounded-2xl border border-navy-line bg-navy-card p-5 sm:p-7">
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-body sm:text-lg">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex screen items-center bg-navy-alt text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-teal">How it works</p>
          <h2 className="display mt-6">Three steps. Brief in, crew on site.</h2>
          <ol className="mt-8 grid gap-3 sm:mt-10 md:grid-cols-3 md:gap-5">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-navy-line bg-navy-card p-5 sm:p-7"
              >
                <div className="flex items-center gap-3">
                  <Icon name={step.icon} />
                  <span className="kicker text-teal">Step {index + 1}</span>
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">{step.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-body">{step.body}</p>
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
            <Link href="/clients" className="pill pill-line w-full sm:w-auto">
              Builders FAQ
            </Link>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-teal">Our standard</p>
          <h2 className="display mt-6">The same standard on every start.</h2>
          <ul className="mt-8 grid gap-3 sm:mt-10">
            {standards.map((item) => (
              <li key={item} className="flex gap-4 rounded-2xl border border-navy-line bg-navy-card p-5 sm:gap-5 sm:p-7">
                <span aria-hidden="true" className="mt-3 h-2 w-2 flex-none rounded-full bg-teal" />
                <p className="text-xl font-semibold leading-snug tracking-tight sm:text-3xl">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex screen items-center bg-navy-alt text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-teal">Where we work</p>
          <h2 className="display mt-6">Construction labour across Sydney.</h2>
          <p className="lede mt-8 text-body">
            We supply construction labour to building sites across Sydney,
            from the CBD and the suburbs to Western Sydney.
          </p>
        </div>
      </section>

      <PhotoSection />

      <section className="grid screen grid-rows-2 bg-navy text-white md:grid-cols-2 md:grid-rows-1">
        <a
          href={BOOK_LABOUR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center justify-center text-center border-b transition-colors hover:bg-white/[0.03] border-navy-line px-5 py-16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-teal sm:px-10 md:border-b-0 md:border-r"
        >
          <p className="kicker text-teal">For builders</p>
          <h2 className="mx-auto mt-4 max-w-lg text-balance text-3xl font-bold tracking-tight sm:text-[2.5rem] sm:leading-[1.1]">
            Need labour on site? Send us the brief.
          </h2>
          <span className="mt-8 text-sm font-medium text-teal-300 transition">Book labour →<span className="sr-only"> (form opens in a new tab)</span></span>
        </a>
        <Link
          href="/candidates"
          className="group flex flex-col items-center justify-center text-center px-5 transition-colors hover:bg-white/[0.03] py-16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-teal sm:px-10"
        >
          <p className="kicker text-teal">For workers</p>
          <h2 className="mx-auto mt-4 max-w-lg text-balance text-3xl font-bold tracking-tight sm:text-[2.5rem] sm:leading-[1.1]">
            Looking for construction work in Sydney? Register with us.
          </h2>
          <span className="mt-8 text-sm font-medium text-teal-300 transition">Apply for work →</span>
        </Link>
      </section>
    </>
  );
}
