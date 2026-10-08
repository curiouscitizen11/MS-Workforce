import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL, EMAIL_HREF, REQUEST_LABOUR_HREF } from "@/components/site";

export const metadata: Metadata = {
  title: "Labour Hire for Builders in Sydney",
  description:
    "How MS Workforce supplies construction labour to Sydney builders: send the brief, we match screened labour, crew on site, simple weekly invoicing. Builders FAQ included.",
  alternates: { canonical: "/clients" },
  openGraph: {
    title: "Labour Hire for Builders in Sydney | MS Workforce",
    description:
      "Send the brief, we match screened labour, crew on site, simple weekly invoicing.",
    url: "/clients",
  },
};

const steps = [
  {
    title: "Send the brief",
    body: "Email the site address, start date and time, the roles and numbers you need, how long for, and who the workers report to.",
  },
  {
    title: "We match the right labour",
    body: "We match workers we have screened ourselves to the job, and confirm PPE, access and site requirements with you before every start.",
  },
  {
    title: "Crew on site",
    body: "Workers arrive knowing the site, the start time and the site contact. Your team directs the work day to day, and we stay in contact throughout.",
  },
  {
    title: "Simple weekly invoicing",
    body: "One clear weekly invoice based on approved hours, with rates agreed in writing before the first start.",
  },
];

const faqs = [
  {
    q: "What kind of work can you cover?",
    a: "General labouring, trade assistance, site cleans, rubbish removal and materials handling on residential, renovation and commercial sites across Greater Sydney.",
  },
  {
    q: "How much notice do you need?",
    a: "As much as you can give, but short-notice requests are welcome. We will tell you straight away whether we can fill it. We would rather say no than send the wrong person.",
  },
  {
    q: "Can I book someone for a single day?",
    a: "Yes. We supply day labour, short-notice cover, ongoing supply and project-based crews, so you can book a single day, a few weeks or a full stage of the build.",
  },
  {
    q: "Who directs the workers on site?",
    a: "Your site team directs the work day to day. MS Workforce stays the employer: we run the payroll and super, and we stay in contact with you and the worker for the length of the booking.",
  },
  {
    q: "What happens if a worker is not the right fit?",
    a: "Tell us the same day. We will talk it through with you and work on a replacement as a priority.",
  },
  {
    q: "How are rates and invoicing handled?",
    a: "We quote per role in writing before the first start, based on the work, the hours and the site. You then receive one simple weekly invoice based on approved hours.",
  },
  {
    q: "Which areas do you cover?",
    a: "Greater Sydney. We are based on the Northern Beaches and supply sites from the Northern Beaches and North Shore through to the CBD, Inner West, Eastern Suburbs and Western Sydney.",
  },
  {
    q: "What do you need from us to get started?",
    a: "The site address, start date and time, roles and numbers, expected duration, a site contact, and any PPE, access or parking notes. The Request labour button opens an email with these prompts filled in.",
  },
];

export default function ClientsPage() {
  return (
    <>
      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">For builders</p>
          <h1 className="display mt-6">Reliable labour for Sydney builders.</h1>
          <p className="lede mt-8 text-white/75">
            Tell us the site, the start time and the roles. We match the right
            people, confirm the details with you, and have them on site ready
            to work.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href={REQUEST_LABOUR_HREF} className="pill pill-light w-full sm:w-auto">
              Request labour
            </a>
            <Link href="/services" className="pill pill-line w-full sm:w-auto">
              What we supply
            </Link>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">How it works</p>
          <h2 className="display mt-6">Four steps from brief to site.</h2>
          <ol className="mt-14 border-b border-navy/10">
            {steps.map((step, index) => (
              <li key={step.title} className="stack-row border-t border-navy/10">
                <span className="kicker text-navy/40 sm:col-span-2">0{index + 1}</span>
                <div className="sm:col-span-10">
                  <h3 className="text-2xl font-semibold tracking-tight sm:text-4xl">{step.title}</h3>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy/70 sm:text-lg">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Builders FAQ</p>
          <h2 className="display mt-6">Common questions.</h2>
          <div className="mt-14 border-b border-white/10">
            {faqs.map((item) => (
              <details key={item.q} className="group border-t border-white/10">
                <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-6 py-6 text-xl font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal sm:text-2xl [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="mt-1 flex-none text-2xl font-normal leading-none text-teal transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-8 text-base leading-relaxed text-white/70 sm:text-lg">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">Request labour</p>
          <h2 className="display mt-6">Send us the brief.</h2>
          <p className="lede mt-8 text-navy/70">
            One email with the site, start time, roles and numbers is all it
            takes. Every request gets a personal reply from the owner.
          </p>
          <div className="mt-10 flex flex-col items-start gap-6">
            <a href={REQUEST_LABOUR_HREF} className="pill pill-dark">
              Request labour
            </a>
            <a
              href={EMAIL_HREF}
              className="break-all text-lg font-medium text-teal underline decoration-teal/40 underline-offset-4 sm:text-2xl"
            >
              {EMAIL}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
