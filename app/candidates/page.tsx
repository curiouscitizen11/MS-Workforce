import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icons";
import { JOBS_EMAIL, WORK_ENQUIRY_HREF, WORKER_FORM_URL, socialMeta } from "@/components/site";
import { tickets, extras, PRICES_CHECKED, type Ticket } from "@/components/tickets";

const pageDescription =
  "Looking for construction labouring work in Greater Sydney? Register with MS Workforce for general labouring, trade assistant and site support work.";

export const metadata: Metadata = {
  title: "Construction Jobs in Sydney",
  description: pageDescription,
  alternates: { canonical: "/candidates" },
  ...socialMeta("/candidates", "Construction Jobs in Sydney | MS Workforce", pageDescription),
};

const work: { icon: IconName; title: string; body: string }[] = [
  { icon: "hardhat", title: "General labouring", body: "Site preparation, clean-up, loading and the everyday work on a build." },
  { icon: "wrench", title: "Trade assistant work", body: "Working alongside carpenters, concreters, bricklayers and other trades." },
  { icon: "sparkle", title: "Site cleans and materials handling", body: "Cleans, rubbish removal, deliveries and moving materials around site." },
];

const lookFor: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "clock",
    title: "Reliability",
    body: "You turn up on time, every time, and let us know early if something changes.",
  },
  {
    icon: "check",
    title: "Attitude",
    body: "You take the work seriously, look after the site and get on well with the crew.",
  },
  {
    icon: "hardhat",
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

const formUrl = WORKER_FORM_URL;

function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <li className="flex flex-col rounded-2xl border border-navy-line bg-navy-card p-6 sm:p-8">
      <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{ticket.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-body">{ticket.code}</p>
      {ticket.note ? <p className="mt-3 text-sm leading-relaxed text-body">{ticket.note}</p> : null}
      <ul className="mt-5 flex-1 border-b border-navy-line">
        {ticket.providers.map((provider) => (
          <li key={provider.href} className="border-t border-navy-line py-4">
            <a
              href={provider.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white underline decoration-teal/50 underline-offset-4 hover:decoration-teal"
            >
              {provider.name}
              {provider.label ? ": " + provider.label : ""}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <p className="mt-1 text-sm text-body">
              {provider.location} · RTO {provider.rto} ·{" "}
              <span className="font-medium text-body">{provider.price}</span>
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
              className="text-sm font-medium text-teal-300 underline decoration-teal/40 underline-offset-4"
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
      <section className="bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">For workers</p>
          <h1 className="display mt-4">Construction work across Greater Sydney.</h1>
          <p className="lede mt-5 text-body">
            We place general labourers, trade assistants and site support
            workers with builders across Sydney. Register once through the
            employee portal and we will contact you when work suits your skills
            and location.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href={formUrl} className="pill pill-teal w-full sm:w-auto" target="_blank" rel="noopener noreferrer">
              Apply for work
              <span className="sr-only"> (employee portal opens in a new tab)</span>
            </a>
            <a href={WORK_ENQUIRY_HREF} className="link-quiet link-quiet-light w-full sm:w-auto">
              Email us
            </a>
          </div>
          <p className="mt-2">
            <a
              href="#tickets"
              className="inline-flex min-h-11 items-center text-base font-medium text-teal-300 underline decoration-teal-300/40 underline-offset-4 hover:text-white"
            >
              Get your tickets
            </a>
          </p>
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">The work</p>
          <h2 className="display mt-4">Labouring, trade assistant and site support work.</h2>
          <ul className="mt-8 grid gap-3 sm:mt-10">
            {work.map((item) => (
              <li key={item.title} className="num-card">
                <Icon name={item.icon} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{item.title}</h3>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">What we look for</p>
          <h2 className="display mt-4">Reliable people who take the work seriously.</h2>
          <ul className="mt-8 grid gap-3 sm:mt-10">
            {lookFor.map((item) => (
              <li key={item.title} className="num-card">
                <Icon name={item.icon} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{item.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-body sm:text-lg">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">What you can expect</p>
          <h2 className="display mt-4">Looked after on every job.</h2>
          <ul className="mt-8 grid gap-3 sm:mt-10">
            {expect.map((item) => (
              <li key={item} className="flex gap-4 rounded-2xl border border-navy-line bg-navy-card p-5 sm:gap-5 sm:p-7">
                <Icon name="check" small className="mt-0.5" />
                <p className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="tickets" className="bg-navy-alt text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">Get your tickets</p>
          <h2 className="display mt-4">Missing a ticket? Here&apos;s where to get it in Sydney.</h2>
          <p className="lede mt-5 text-body">
            More tickets mean more sites you can work on. These registered
            training providers run the courses across Sydney. Most take a day or two.
          </p>
          <ul className="mt-8 grid sm:mt-10 gap-5 md:grid-cols-2">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.title} ticket={ticket} />
            ))}
          </ul>
          <h3 className="kicker mt-16 text-body">Useful extras</h3>
          <ul className="mt-6 grid gap-5 md:grid-cols-2">
            {extras.map((ticket) => (
              <TicketCard key={ticket.title} ticket={ticket} />
            ))}
          </ul>
          <div className="mt-10 max-w-3xl space-y-2 text-sm leading-relaxed text-body">
            <p>
              Prices are as listed by each provider in {PRICES_CHECKED} and may
              be subject to change. Check with the provider before booking.
            </p>
            <p>
              Links go to independent registered training providers. MS
              Workforce isn&apos;t affiliated with them; check dates and
              requirements with the provider.
            </p>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={formUrl} className="pill pill-teal w-full sm:w-auto" target="_blank" rel="noopener noreferrer">
              Got your tickets? Register now
            </a>
            <a href={WORK_ENQUIRY_HREF} className="pill pill-line w-full sm:w-auto">
              Email us
            </a>
          </div>
        </div>
      </section>

      <section id="register" className="scroll-mt-14 bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">How to register</p>
          <h2 className="display mt-4">Register through the employee portal.</h2>
          <p className="lede mt-5 text-body">
            The employee portal is where you submit your details and documents.
            It takes a few minutes. We only ask whether you hold a White Card
            and other tickets; we sight the cards themselves before any
            placement. If you have a question first, email us.
          </p>
          <div className="mt-10 flex flex-col items-start gap-4">
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium text-teal-300 underline decoration-teal-300/40 underline-offset-4 sm:text-2xl"
            >
              Open the employee portal
            </a>
            <a
              href={WORK_ENQUIRY_HREF}
              className="text-lg font-medium text-white underline decoration-white/30 underline-offset-4 sm:text-2xl break-all"
            >
              {JOBS_EMAIL}
            </a>
            <Link
              href="/privacy"
              className="text-sm text-body underline decoration-white/30 underline-offset-4 hover:text-white"
            >
              How we handle your information
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
