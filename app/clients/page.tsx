import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL, EMAIL_HREF, REQUEST_LABOUR_HREF, socialMeta } from "@/components/site";

const pageDescription =
  "How MS Workforce supplies construction labour to Sydney builders: send the brief, we match screened labour, simple weekly invoicing. FAQ included.";

export const metadata: Metadata = {
  title: "Labour Hire for Builders in Sydney",
  description: pageDescription,
  alternates: { canonical: "/clients" },
  ...socialMeta("/clients", "Labour Hire for Builders in Sydney | MS Workforce", pageDescription),
};

const steps = [
  {
    title: "Send the brief",
    body: "Use the Book labour form or email the site address, start date and time, the roles and numbers you need, how long for, and who the workers report to.",
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
    q: "How much notice do you need?",
    a: "As much as you can give, but short-notice requests are welcome. We will tell you straight away whether we can fill it. We would rather say no than send the wrong person.",
  },
  {
    q: "Can I book someone for a single day?",
    a: "Yes. We supply day labour, short-notice cover, ongoing supply and project-based crews, so you can book a single day, a few weeks or a full stage of the build.",
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
    a: "All of Sydney. We supply building sites across Sydney, from the CBD and the suburbs out to Western Sydney.",
  },
  {
    q: "What do you need from us to get started?",
    a: "The site address, start date and time, roles and numbers, expected duration, a site contact, and any PPE, access or parking notes. The Book labour form asks for each of these, or the Email the brief button opens an email with the same prompts filled in.",
  },
];

// FAQ structured data: built from the same visible questions and answers above, nothing extra.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function ClientsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">For builders</p>
          <h1 className="display mt-4">Reliable labour for Sydney builders.</h1>
          <p className="lede mt-5 text-body">
            Tell us the site, the start time and the roles. We match the right
            people, confirm the details with you, and have them on site ready
            to work.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href="/portal/book-labour"
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
          <p className="mt-6 text-sm text-body">
            See our full range of roles and booking options on the{" "}
            <Link href="/services" className="text-teal-300 underline decoration-teal-300/40 underline-offset-4 hover:text-white">
              Services page
            </Link>
            .
          </p>
          <p className="mt-2 text-sm text-body">
            Prefer email? Write to{" "}
            <a href={EMAIL_HREF} className="text-teal-300 underline decoration-teal-300/40 underline-offset-4 hover:text-white">
              {EMAIL}
            </a>
            .
          </p>
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">How it works</p>
          <h2 className="display mt-4">Four steps from brief to site.</h2>
          <ol className="mt-8 grid gap-3 sm:mt-10">
            {steps.map((step, index) => (
              <li key={step.title} className="num-card">
                <span className="num-badge">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold tracking-tight sm:text-3xl">{step.title}</h3>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">Builders FAQ</p>
          <h2 className="display mt-4">Common questions.</h2>
          <div className="mt-8 grid gap-3 sm:mt-10">
            {faqs.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-navy-line bg-navy-card px-5 sm:px-7">
                <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-6 py-6 text-xl font-bold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal sm:text-2xl [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="mt-1 flex-none text-2xl font-normal leading-none text-teal-300 transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-8 text-base leading-relaxed text-body sm:text-lg">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">Request labour</p>
          <h2 className="display mt-4">Send us the brief.</h2>
          <p className="lede mt-5 text-body">
            Every request gets a personal reply from the owner.
          </p>
          <div className="mt-10 flex flex-col items-start gap-6">
            <a
              href="/portal/book-labour"
              target="_blank"
              rel="noopener noreferrer"
              className="pill pill-teal w-full sm:w-auto"
            >
              Book labour
              <span className="sr-only"> (form opens in a new tab)</span>
            </a>
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center text-sm text-body underline decoration-white/30 underline-offset-4 hover:text-white"
            >
              How we handle your information
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
