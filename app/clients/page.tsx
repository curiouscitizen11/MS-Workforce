import type { Metadata } from "next";
import Link from "next/link";
import { BookLabourLink } from "@/components/PublicActions";
import ReplySla from "@/components/ReplySla";
import { BOOKING_STEPS, RATE_LINES, REPLY_SLA } from "@/components/publicCopy";
import { EMAIL, EMAIL_HREF, REQUEST_LABOUR_HREF, socialMeta } from "@/components/site";

const pageDescription =
  "How MS Workforce supplies construction labour to Sydney builders: send the brief, we match screened labour, simple weekly invoicing. FAQ included.";

export const metadata: Metadata = {
  title: "Labour Hire for Builders in Sydney",
  description: pageDescription,
  alternates: { canonical: "/clients" },
  ...socialMeta("/clients", "Labour Hire for Builders in Sydney | MS Workforce", pageDescription),
};

const faqs = [
  {
    q: "What PPE is needed?",
    a: "A White Card is required on construction sites. Tell us any other tickets, and the gear the site asks for, such as boots, a hard hat and hi-vis.",
  },
  {
    q: "What if a worker is not the right fit?",
    a: "Tell us the same day, including a no-show. We will work on a replacement. We do not promise a set replacement time.",
  },
  {
    q: "Can you send someone the same day?",
    a: "We do not promise same-day dispatch. " + REPLY_SLA,
  },
  {
    q: "Who employs the worker?",
    a: "We supply the labour and look after pay and super for the workers we send. Workers are paid weekly. We confirm any minimum hours when we quote.",
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
        <div className="wrap section-pad">
          <p className="kicker text-teal">For builders</p>
          <h1 className="display mt-4">Reliable labour for Sydney builders.</h1>
          <p className="lede mt-5 text-body">
            Tell us the site, the start time and the roles. We match the right
            people, confirm the details with you, and have them on site ready
            to work.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <BookLabourLink className="pill pill-teal w-full sm:w-auto" />
            <a href={REQUEST_LABOUR_HREF} className="link-quiet link-quiet-light w-full sm:w-auto">
              Email the brief
            </a>
          </div>
          <p className="mt-6 text-small text-body">
            See our full range of roles and booking options on the{" "}
            <Link href="/services" className="text-teal-300 underline decoration-teal-300/40 underline-offset-4 hover:text-white">
              Services page
            </Link>
            .
          </p>
          <p className="mt-2 text-small text-body">
            Prefer email? Write to{" "}
            <a href={EMAIL_HREF} className="text-teal-300 underline decoration-teal-300/40 underline-offset-4 hover:text-white">
              {EMAIL}
            </a>
            .
          </p>
          <ReplySla className="mt-4" />
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap section-pad">
          <p className="kicker text-teal">How it works</p>
          <h2 className="section-title mt-4">Three steps before anyone is dispatched.</h2>
          <ol className="card-grid mt-8 md:mt-10">
            {BOOKING_STEPS.map((step, index) => (
              <li key={step} className="num-card">
                <span className="num-badge">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="card-title">{step}</h3>
                </div>
              </li>
            ))}
          </ol>
          <div id="rate" className="mt-8 max-w-prose scroll-mt-14 space-y-2">
            <p className="kicker text-teal">What&apos;s in the rate</p>
            {RATE_LINES.map((line) => (
              <p key={line} className="copy">{line}</p>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-14 bg-navy text-white">
        <div className="wrap section-pad">
          <p className="kicker text-teal">Builders FAQ</p>
          <h2 className="section-title mt-4">Common questions.</h2>
          <div className="card-grid mt-8 md:mt-10">
            {faqs.map((item) => (
              <details key={item.q} className="group card">
                <summary className="flex min-h-12 cursor-pointer list-none items-start justify-between gap-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal [&::-webkit-details-marker]:hidden">
                  <span className="card-title">{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex-none text-h3 font-normal leading-none text-teal-300 transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="copy mt-3">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap section-pad">
          <p className="kicker text-teal">Request labour</p>
          <h2 className="section-title mt-4">Send us the brief.</h2>
          <p className="lede mt-5 text-body">
            Every request gets a personal reply from the owner.
          </p>
          <div className="mt-10 flex flex-col items-start gap-6">
            <BookLabourLink className="pill pill-teal w-full sm:w-auto" />
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center text-small text-body underline decoration-white/30 underline-offset-4 hover:text-white"
            >
              How we handle your information
            </Link>
          </div>
          <ReplySla className="mt-6" />
        </div>
      </section>
    </>
  );
}
