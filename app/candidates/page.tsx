import type { Metadata } from "next";
import { EMAIL, WORK_ENQUIRY_HREF, OG_BASE } from "@/components/site";
import { tickets, extras, PRICES_CHECKED, type Ticket } from "@/components/tickets";

export const metadata: Metadata = {
  title: "Construction Jobs in Sydney",
  description:
    "Looking for construction labouring work across Greater Sydney? Register with MS Workforce through the employee portal for general labouring, trade assistant and site support work.",
  alternates: { canonical: "/candidates" },
  openGraph: {
    ...OG_BASE,
    title: "Construction Jobs in Sydney | MS Workforce",
    description:
      "Register through the employee portal for general labouring, trade assistant and site support work across Greater Sydney.",
    url: "/candidates",
  },
};

const work = [
  { title: "General labouring", body: "Site preparation, clean-up, loading and the everyday work on a build." },
  { title: "Trade assistant work", body: "Working alongside carpenters, concreters, bricklayers and other trades." },
  { title: "Site cleans and materials handling", body: "Cleans, rubbish removal, deliveries and moving materials around site." },
];

const lookFor = [
  {
    title: "Reliability",
    body: "You turn up on time, every time, and let us know early if something changes.",
  },
  {
    title: "Attitude",
    body: "You take the work seriously, look after the site and get on well with the crew.",
  },
  {
    title: "Experience helps",
    body: "Construction experience is a plus. Willingness to learn and work hard matters just as much.",
  },
];

const expect = [
  "Clear details before every start: the site, the start time, the site contact and what to bring.",
  "Correct pay and super, on time.",
  "Straight answers about the work before you say yes.",
  "Someone who picks up your message when something is not right on site.",
];

const formUrl =
  "https://protective-stamp-342.notion.site/69740d4cbc6c41ef914d8fb316b4b957?pvs=105";

function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <li className="flex flex-col rounded-2xl border border-navy/10 bg-white p-6 sm:p-8">
      <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{ticket.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-navy/55">{ticket.code}</p>
      {ticket.note ? <p className="mt-3 text-sm leading-relaxed text-navy/70">{ticket.note}</p> : null}
      <ul className="mt-5 flex-1 border-b border-navy/10">
        {ticket.providers.map((provider) => (
          <li key={provider.href} className="border-t border-navy/10 py-4">
            <a
              href={provider.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-navy underline decoration-teal/50 underline-offset-4 hover:decoration-teal"
            >
              {provider.name}
              {provider.label ? ": " + provider.label : ""}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <p className="mt-1 text-sm text-navy/60">
              {provider.location} · RTO {provider.rto} ·{" "}
              <span className="font-medium text-navy/80">{provider.price}</span>
            </p>
          </li>
        ))}
      </ul>
      {ticket.official ? (
        <div className="mt-4 flex flex-col gap-2">
          {ticket.official.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-teal-600 underline decoration-teal/40 underline-offset-4"
            >
              {link.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ))}
        </div>
      ) : null}
    </li>
  );
}

export default function CandidatesPage() {
  return (
    <>
      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">For workers</p>
          <h1 className="display mt-6">Construction work across Greater Sydney.</h1>
          <p className="lede mt-8 text-white/75">
            We place general labourers, trade assistants and site support
            workers with builders across Sydney. Register once through the
            employee portal and we will contact you when work suits your skills
            and location.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href={formUrl} className="pill pill-light w-full sm:w-auto" target="_blank" rel="noopener noreferrer">
              Employee portal
            </a>
            <a href={WORK_ENQUIRY_HREF} className="pill pill-line w-full sm:w-auto">
              Email us
            </a>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">The work</p>
          <h2 className="display mt-6">Labouring, trade assistant and site support work.</h2>
          <ul className="mt-14 border-b border-navy/10">
            {work.map((item, index) => (
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
          <p className="kicker text-white/50">What we look for</p>
          <h2 className="display mt-6">Reliable people who take the work seriously.</h2>
          <ul className="mt-14 border-b border-white/10">
            {lookFor.map((item) => (
              <li key={item.title} className="stack-row border-t border-white/10">
                <h3 className="text-2xl font-semibold tracking-tight sm:col-span-4 sm:text-3xl">{item.title}</h3>
                <p className="text-base leading-relaxed text-white/70 sm:col-span-8 sm:text-lg">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">What you can expect</p>
          <h2 className="display mt-6">Looked after on every job.</h2>
          <ul className="mt-14 border-b border-navy/10">
            {expect.map((item) => (
              <li key={item} className="flex gap-5 border-t border-navy/10 py-6 sm:py-8">
                <span aria-hidden="true" className="mt-3 h-2 w-2 flex-none rounded-full bg-teal" />
                <p className="text-xl font-medium leading-snug tracking-tight sm:text-2xl">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="tickets" className="flex screen items-center bg-navy-50 text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">Get your tickets</p>
          <h2 className="display mt-6">Missing a ticket? Here&apos;s where to get it in Sydney.</h2>
          <p className="lede mt-8 text-navy/70">
            More tickets mean more sites you can work on. These registered
            training providers run the courses on the Northern Beaches and
            across Sydney. Most take a day or two.
          </p>
          <ul className="mt-14 grid gap-5 md:grid-cols-2">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.title} ticket={ticket} />
            ))}
          </ul>
          <h3 className="kicker mt-16 text-navy/45">Useful extras</h3>
          <ul className="mt-6 grid gap-5 md:grid-cols-2">
            {extras.map((ticket) => (
              <TicketCard key={ticket.title} ticket={ticket} />
            ))}
          </ul>
          <div className="mt-10 max-w-3xl space-y-2 text-sm leading-relaxed text-navy/60">
            <p>
              Prices are as listed by each provider on {PRICES_CHECKED} and may
              be subject to change. Check with the provider before booking.
            </p>
            <p>
              Links go to independent registered training providers. MS
              Workforce isn&apos;t affiliated with them; check dates and
              requirements with the provider.
            </p>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={formUrl} className="pill pill-dark w-full sm:w-auto" target="_blank" rel="noopener noreferrer">
              Got your tickets? Register now
            </a>
            <a href={WORK_ENQUIRY_HREF} className="pill pill-line-dark w-full sm:w-auto">
              Email us
            </a>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">How to register</p>
          <h2 className="display mt-6">Register through the employee portal.</h2>
          <p className="lede mt-8 text-white/75">
            The employee portal is where you submit your details and documents.
            It takes a few minutes. If you have a question first, email us.
          </p>
          <div className="mt-10 flex flex-col items-start gap-4">
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium text-teal underline decoration-teal/40 underline-offset-4 sm:text-2xl"
            >
              Open the employee portal
            </a>
            <a
              href={WORK_ENQUIRY_HREF}
              className="text-lg font-medium text-white underline decoration-white/30 underline-offset-4 sm:text-2xl break-all"
            >
              {EMAIL}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
