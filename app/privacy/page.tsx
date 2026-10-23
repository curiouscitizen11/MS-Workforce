import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL, EMAIL_HREF, JOBS_EMAIL, JOBS_EMAIL_HREF, OG_BASE } from "@/components/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MS Workforce collects, uses, stores and shares personal information about workers, applicants, clients and website visitors.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    ...OG_BASE,
    title: "Privacy Policy | MS Workforce",
    description: "How MS Workforce handles personal information.",
    url: "/privacy",
  },
};

const mail = "text-teal-700 underline decoration-teal-700/40 underline-offset-4 break-all";
const ext = "text-teal-700 underline decoration-teal-700/40 underline-offset-4";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Who we are",
    body: (
      <p>
        MS Workforce is a construction labour hire business supplying
        builders across Sydney, NSW. Questions about this policy:{" "}
        <a href={EMAIL_HREF} className={mail}>{EMAIL}</a>.
      </p>
    ),
  },
  {
    title: "Our approach",
    body: (
      <p>
        We aim to handle personal information in line with the Australian
        Privacy Principles. We collect only what we need to do the job, keep it
        secure, and delete it when we no longer need it.
      </p>
    ),
  },
  {
    title: "What we collect",
    body: (
      <ul className="list-disc space-y-3 pl-5">
        <li>
          <strong>Workers and applicants:</strong> name, contact details,
          location, right-to-work details, work history, licence and ticket
          details (type, card number, issuer and expiry), verification records,
          availability and emergency contact.
        </li>
        <li>
          <strong>Tax file number, bank and super details are not collected
          through our website or forms.</strong> If you are employed, they are
          collected directly through our payroll provider.
        </li>
        <li>
          <strong>Clients:</strong> business contact details and job
          requirements.
        </li>
        <li>
          <strong>Website visitors:</strong> messages you send us. We do not use
          tracking cookies or advertising analytics. Our hosting provider keeps
          standard technical logs (such as IP address and browser type) to run
          and secure the site.
        </li>
      </ul>
    ),
  },
  {
    title: "How we collect it",
    body: (
      <p>
        Directly from you through our online forms, email, phone or video calls.
        With your consent, from training providers or government registers (for
        example Service NSW or SafeWork NSW) when we verify your tickets.
      </p>
    ),
  },
  {
    title: "Why we collect it",
    body: (
      <p>
        To assess applications, verify qualifications, meet work health and
        safety and employment law obligations, place workers with clients, pay
        employees, and communicate with you. If you don&apos;t give us the
        information we need, we may not be able to offer you work or supply
        labour.
      </p>
    ),
  },
  {
    title: "Ticket and ID checks",
    body: (
      <p>
        We prefer to check cards on a short video call or in the Service NSW
        app. Any photos of cards or ID you upload are used only for checking and
        are deleted once verified. We keep a record of the card type, number,
        expiry, and when and how it was checked.
      </p>
    ),
  },
  {
    title: "Who we share it with",
    body: (
      <p>
        With host clients where you are placed (with your consent, and only the
        relevant details such as your name, tickets and licences), with our
        service providers (forms, database, email, website hosting, payroll and
        accounting), and with regulators where the law requires. We do not sell
        personal information.
      </p>
    ),
  },
  {
    title: "Overseas storage",
    body: (
      <p>
        Our service providers store data outside Australia: our forms provider
        Tally in the European Union, and Notion (database), Google (email and
        documents), Vercel (website hosting) and our payroll provider in the
        United States. We choose reputable providers that encrypt data in
        transit and at rest.
      </p>
    ),
  },
  {
    title: "Security",
    body: (
      <p>
        Access is limited to the owner, using two-step sign-in. Worker forms
        are private and password protected. We do not keep copies of identity
        documents after verifying them, and we delete information we no longer
        need.
      </p>
    ),
  },
  {
    title: "How long we keep it",
    body: (
      <p>
        Unsuccessful applications are deleted after 6 months. Employee and
        safety records, including ticket verification records (not images), are
        kept as required by law, generally 7 years.
      </p>
    ),
  },
  {
    title: "Access, correction and complaints",
    body: (
      <p>
        You can ask to see or correct your information, or make a complaint, by
        emailing <a href={EMAIL_HREF} className={mail}>{EMAIL}</a> (workers can
        also use <a href={JOBS_EMAIL_HREF} className={mail}>{JOBS_EMAIL}</a>).
        We&apos;ll respond within 30 days. If you&apos;re not satisfied with our
        response, you can contact the{" "}
        <a
          href="https://www.oaic.gov.au/privacy/privacy-complaints"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Office of the Australian Information Commissioner
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
    ),
  },
  {
    title: "Changes",
    body: <p>We&apos;ll post any updates to this policy on this page.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/65">Privacy</p>
          <h1 className="display mt-6">Privacy Policy</h1>
          <p className="lede mt-8 text-white/75">
            How we handle your information. Last updated 13 October 2026.
          </p>
        </div>
      </section>

      <section className="bg-tint text-navy">
        <div className="wrap py-20 sm:py-24">
          <div className="max-w-3xl border-b border-navy/10">
            {sections.map((s) => (
              <div key={s.title} className="border-t border-navy/10 py-8">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{s.title}</h2>
                <div className="mt-4 space-y-4 text-lg leading-relaxed text-navy/75">{s.body}</div>
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm text-navy/75">
            <Link href="/" className="underline underline-offset-4">Back to home</Link>
          </p>
        </div>
      </section>
    </>
  );
}
