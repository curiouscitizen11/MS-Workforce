import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For candidates",
  description:
    "What MS Workforce looks for, the tickets we record, and how to apply by form or email. We will be in touch when a suitable job comes up.",
};

const lookFor = [
  {
    title: "Attitude and reliability",
    body: "People who turn up and take the work seriously.",
  },
  {
    title: "White card",
    body: "Expected. It is the baseline ticket for site work.",
  },
  {
    title: "Site induction",
    body: "You need to be willing to do the induction for the site.",
  },
  {
    title: "Experience",
    body: "Construction experience is a plus.",
  },
];

const tickets = [
  "White card, including number and expiry",
  "Work at heights",
  "Asbestos class A",
  "Asbestos class B",
  "Confined space",
  "Driver licence",
  "First aid",
];

const formUrl =
  "https://protective-stamp-342.notion.site/69740d4cbc6c41ef914d8fb316b4b957?pvs=105";

export default function CandidatesPage() {
  return (
    <>
      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Candidates</p>
          <h1 className="display mt-6">Looking for construction work.</h1>
          <p className="lede mt-8 text-white/75">
            MS Workforce is a new labour hire business on Sydney&apos;s Northern
            Beaches. Send your details by the form or by email. We will be in
            touch when a suitable job comes up.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href={formUrl} className="pill pill-light w-full sm:w-auto" target="_blank" rel="noopener noreferrer">
              Application form
            </a>
            <a href="mailto:smoranc.marek@gmail.com" className="pill pill-line w-full sm:w-auto">
              Email us
            </a>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">What we look for</p>
          <h2 className="display mt-6">A white card, a good attitude, and the induction.</h2>
          <ul className="mt-14 border-b border-navy/10">
            {lookFor.map((item, index) => (
              <li key={item.title} className="stack-row border-t border-navy/10">
                <span className="kicker text-navy/40 sm:col-span-2">0{index + 1}</span>
                <div className="sm:col-span-10">
                  <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{item.title}</h3>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-navy/70 sm:text-lg">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Tickets</p>
          <h2 className="display mt-6">What we record.</h2>
          <ul className="mt-14 max-w-3xl border-b border-white/15">
            {tickets.map((item) => (
              <li key={item} className="border-t border-white/15 py-5 text-xl font-medium tracking-tight sm:text-2xl">
                {item}
              </li>
            ))}
          </ul>
          <p className="lede mt-12 text-white/75">
            White card is the baseline. Work at heights, confined space, and
            asbestos work only go to someone who holds that ticket. Scaffold
            work only goes to a ticketed scaffolder. We do not put someone
            forward for that work without the ticket, and we are not claiming
            those people are already on our books.
          </p>
        </div>
      </section>

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">How to apply</p>
          <h2 className="display mt-6">Form or email.</h2>
          <p className="lede mt-8 text-navy/70">
            Use the application form, or email your details and a short summary
            of your experience. We will be in touch when a suitable job comes
            up.
          </p>
          <div className="mt-10 flex flex-col items-start gap-4">
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium text-teal underline decoration-teal/40 underline-offset-4 sm:text-2xl"
            >
              Open the application form
            </a>
            <a
              href="mailto:smoranc.marek@gmail.com"
              className="text-lg font-medium text-navy underline decoration-navy/30 underline-offset-4 sm:text-2xl break-all"
            >
              smoranc.marek@gmail.com
            </a>
          </div>
          <p className="mt-10 max-w-xl text-base leading-relaxed text-navy/60">
            Right to work is checked, tickets are sighted, and the site
            induction is done before anyone is placed.
          </p>
        </div>
      </section>
    </>
  );
}
