import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icons";
import { REQUEST_LABOUR_HREF, socialMeta } from "@/components/site";

const pageTitle = "Construction Labour Hire in Greater Sydney | MS Workforce";
const pageDescription =
  "MS Workforce supplies construction labour to building sites across Greater Sydney, from the CBD and suburbs to Western Sydney. Book labour online.";

export const metadata: Metadata = {
  title: { absolute: pageTitle },
  description: pageDescription,
  alternates: { canonical: "/labour-hire-greater-sydney" },
  ...socialMeta("/labour-hire-greater-sydney", pageTitle, pageDescription),
};

const supply: { icon: IconName; title: string; body: string }[] = [
  { icon: "hardhat", title: "General labourers", body: "Site preparation, clean-up, loading and unloading, and the day-to-day work that keeps a build moving." },
  { icon: "wrench", title: "Trade assistants", body: "Hands-on support for carpenters, concreters, bricklayers and other trades." },
  { icon: "sparkle", title: "Site cleans and site support", body: "Progressive cleans, builders cleans, rubbish removal and skip loading." },
  { icon: "package", title: "Materials handling", body: "Receiving deliveries and stacking, protecting and distributing materials around the site." },
];

// These questions and answers use wording already on the Builders page. The FAQ structured
// data below is built from this same list, so it always matches what visitors can read.
const faqs = [
  {
    q: "Which areas do you cover?",
    a: "Greater Sydney. We supply building sites from the CBD and the suburbs out to Western Sydney.",
  },
  {
    q: "How much notice do you need?",
    a: "As much as you can give, but short-notice requests are welcome. We will tell you straight away whether we can fill it. We would rather say no than send the wrong person.",
  },
  {
    q: "What do you need from us to get started?",
    a: "The site address, start date and time, roles and numbers, expected duration, a site contact, and any PPE, access or parking notes. The Book labour form asks for each of these, or the Email the brief button opens an email with the same prompts filled in.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function GreaterSydneyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">Greater Sydney</p>
          <h1 className="display mt-4">Construction labour across Greater Sydney.</h1>
          <p className="lede mt-5 text-body">
            We supply construction labour to building sites across Greater
            Sydney, from the CBD and the suburbs to Western Sydney. Book one
            worker for a day or a crew for the whole project.
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
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What we supply on site</h2>
          <ul className="mt-8 grid gap-3 sm:mt-10">
            {supply.map((item) => (
              <li key={item.title} className="num-card">
                <Icon name={item.icon} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{item.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-body sm:text-lg">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
            Labour is booked by the day, as short-notice cover, or on an
            ongoing, project-based basis. We match workers we have screened
            ourselves to the job.
          </p>
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Questions about Greater Sydney coverage
          </h2>
          <ul className="mt-8 grid gap-3 sm:mt-10">
            {faqs.map((item) => (
              <li key={item.q} className="rounded-2xl border border-navy-line bg-navy-card p-5 sm:p-7">
                <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{item.q}</h3>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-body sm:text-lg">{item.a}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Need labour on site?</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-body sm:text-lg">
            Send us the brief and we will tell you straight away whether we can fill it.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/services" className="pill pill-line w-full sm:w-auto">
              See all services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
