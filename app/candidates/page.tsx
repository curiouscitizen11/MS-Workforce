import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icons";
import ReplySla from "@/components/ReplySla";
import { WORKER_PAY_LINES } from "@/components/publicCopy";
import { JOBS_EMAIL, WORK_ENQUIRY_HREF, WORKER_FORM_URL, socialMeta } from "@/components/site";
import { tickets, extras, PRICES_CHECKED, type Ticket, type TicketProvider } from "@/components/tickets";

const pageDescription =
  "Looking for construction labouring work across Greater Sydney? Register with MS Workforce for general labouring, trade assistant and site support work.";

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

const ticketGroups: { title: string; titles: string[] }[] = [
  { title: "White Card", titles: ["White Card"] },
  {
    title: "Heights and confined spaces",
    titles: ["Work safely at heights", "Enter and work in confined spaces"],
  },
  {
    title: "Asbestos removal",
    titles: [
      "Asbestos removal: Class B (non-friable)",
      "Asbestos removal: Class A (friable)",
    ],
  },
  { title: "First aid and CPR", titles: ["First aid and CPR"] },
];

const formUrl = WORKER_FORM_URL;

const keptProviders: Record<string, (provider: TicketProvider) => boolean> = {
  "White Card": (provider) =>
    provider.href === "https://nwcc.edu.au/white-card-nsw/northern-beaches/" ||
    provider.href === "https://www.tcptraining.com/courses/white-card-course-sydney",
  "First aid and CPR": (provider) =>
    provider.name === "Northern Beaches Community College" ||
    provider.label === "CPR only (HLTAID009)",
};

function forPage(ticket: Ticket): Ticket {
  const keep = keptProviders[ticket.title];
  if (!keep) return ticket;
  return { ...ticket, providers: ticket.providers.filter(keep) };
}

function pickTickets(titles: string[]) {
  return titles.map((title) => {
    const ticket = tickets.find((item) => item.title === title);
    if (!ticket) throw new Error("Missing ticket: " + title);
    return forPage(ticket);
  });
}

const safeworkLinks = [...tickets, ...extras].flatMap((ticket) => ticket.official ?? []);

function TicketCard({
  ticket,
  showTitle = true,
  showCode = true,
}: {
  ticket: Ticket;
  showTitle?: boolean;
  showCode?: boolean;
}) {
  const line = ticket.providers.find((provider) => provider.label === "Supervise asbestos removal");
  const providers = line ? ticket.providers.filter((provider) => provider !== line) : ticket.providers;

  return (
    <li className="card flex flex-col">
      {showTitle ? <h3 className="card-title">{ticket.title}</h3> : null}
      {showCode ? (
        <p className={showTitle ? "mt-2 text-small text-body" : "text-small text-body"}>{ticket.code}</p>
      ) : null}
      {ticket.note ? <p className="mt-3 text-small text-body">{ticket.note}</p> : null}
      <ul className="mt-5 flex-1 border-b border-white/10">
        {providers.map((provider) => (
          <li key={provider.href} className="border-t border-white/10 py-3">
            <a
              href={provider.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-medium text-[#fafafa] underline decoration-teal/50 underline-offset-4 hover:decoration-teal"
            >
              {provider.name}
              {provider.label ? ": " + provider.label : ""}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <p className="mt-1 text-small text-body">
              {provider.location} · RTO {provider.rto} ·{" "}
              <span className="font-medium text-body">{provider.price}</span>
            </p>
          </li>
        ))}
      </ul>
      {line ? (
        <p className="mt-4 flex min-h-11 flex-wrap items-center gap-x-2 text-small text-body">
          <a
            href={line.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center font-medium text-teal-300 underline decoration-teal/40 underline-offset-4"
          >
            {line.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <span>{line.name + ", " + line.location + " · RTO " + line.rto + " · " + line.price}</span>
        </p>
      ) : null}
    </li>
  );
}

function TicketGroup({ title, items }: { title: string; items: Ticket[] }) {
  const namedByHeading = items.length === 1 && items[0].title === title;
  return (
    <div className="mt-12 border-t border-white/10 pt-10 md:mt-16 md:pt-12">
      <h2 className="section-title">{title}</h2>
      {namedByHeading ? <p className="mt-3 max-w-prose text-small text-body">{items[0].code}</p> : null}
      <ul className={"card-grid mt-6" + (items.length > 1 ? " md:grid-cols-2" : " max-w-3xl")}>
        {items.map((ticket) => (
          <TicketCard
            key={ticket.title}
            ticket={ticket}
            showTitle={!namedByHeading}
            showCode={!namedByHeading}
          />
        ))}
      </ul>
    </div>
  );
}

export default function CandidatesPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="wrap section-pad">
          <p className="kicker text-teal">For workers</p>
          <h1 className="display mt-4">Construction work across Greater Sydney.</h1>
          <p className="lede mt-5">
            Register once through the employee portal and we will contact you
            when work suits your skills and location.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/portal/join" className="pill pill-teal w-full sm:w-auto" target="_blank" rel="noopener noreferrer">
              Apply for work
              <span className="sr-only"> (employee portal opens in a new tab)</span>
            </a>
            <a href={WORK_ENQUIRY_HREF} className="link-quiet link-quiet-light w-full sm:w-auto">
              Email us
            </a>
          </div>
          <p className="mt-3">
            <a
              href="#tickets"
              className="inline-flex min-h-12 items-center text-base font-medium text-teal-300 underline decoration-teal-300/40 underline-offset-4 hover:text-white"
            >
              Get your tickets
            </a>
          </p>
          <ReplySla className="mt-4" />
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap section-pad">
          <p className="kicker text-teal">Pay</p>
          <h2 className="section-title mt-4">Weekly pay.</h2>
          <div className="mt-5 max-w-prose space-y-2">
            {WORKER_PAY_LINES.map((line) => (
              <p key={line} className="copy">{line}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="wrap section-pad">
          <p className="kicker text-teal">The work</p>
          <h2 className="section-title mt-4">Labouring, trade assistant and site support work.</h2>
          <ul className="card-grid mt-8 md:mt-10">
            {work.map((item) => (
              <li key={item.title} className="num-card">
                <Icon name={item.icon} />
                <div className="min-w-0 flex-1">
                  <h3 className="card-title">{item.title}</h3>
                  <p className="copy mt-3">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap section-pad">
          <h2 className="section-title">Working with us</h2>
          <p className="card-title mt-8">Reliable people who take the work seriously.</p>
          <ul className="card-grid mt-4">
            {lookFor.map((item) => (
              <li key={item.title} className="num-card">
                <Icon name={item.icon} />
                <div className="min-w-0 flex-1">
                  <h3 className="card-title">{item.title}</h3>
                  <p className="copy mt-2">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="card-title mt-10 md:mt-12">Looked after on every job.</p>
          <ul className="card-grid mt-4">
            {expect.map((item) => (
              <li key={item} className="card flex items-start gap-4 md:gap-6">
                <Icon name="check" small className="mt-0.5" />
                <p className="card-title">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="tickets" className="scroll-mt-14 bg-navy text-white">
        <div className="wrap section-pad">
          <p className="kicker text-teal">Get your tickets</p>
          <h2 className="section-title mt-4">Missing a ticket? Here&apos;s where to get it in Sydney.</h2>
          <p className="lede mt-5">
            More tickets mean more sites you can work on. These registered
            training providers run the courses across Sydney. Most take a day or two.
          </p>

          {ticketGroups.map((group) => (
            <TicketGroup key={group.title} title={group.title} items={pickTickets(group.titles)} />
          ))}

          <TicketGroup title="Other tickets" items={extras.map(forPage)} />

          <div className="mt-12 border-t border-white/10 pt-10 md:mt-16 md:pt-12">
            <h2 className="section-title">Check with SafeWork NSW</h2>
            <ul className="mt-6 flex max-w-3xl flex-col gap-3">
              {safeworkLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center text-small font-medium text-teal-300 underline decoration-teal/40 underline-offset-4"
                  >
                    {link.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 border-t border-white/10 pt-10 md:mt-16 md:pt-12">
            <h2 className="section-title">Prices and providers</h2>
            <p className="copy mt-5">
              Prices are as listed by each provider in {PRICES_CHECKED} and may
              change, and these links go to independent providers MS Workforce
              isn&apos;t affiliated with, so check dates and requirements with
              the provider before booking.
            </p>
          </div>
        </div>
      </section>

      <section id="register" className="scroll-mt-14 bg-navy-alt text-white">
        <div className="wrap section-pad">
          <p className="kicker text-teal">How to register</p>
          <h2 className="section-title mt-4">Register through the employee portal.</h2>
          <p className="lede mt-5">
            The employee portal is where you submit your details and documents.
            It takes a few minutes. We only ask whether you hold a White Card
            and other tickets; we sight the cards themselves before any
            placement. If you have a question first, email us.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3">
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center text-base font-semibold text-teal-300 underline decoration-teal-300/40 underline-offset-4"
            >
              Open the employee portal
            </a>
            <a
              href={WORK_ENQUIRY_HREF}
              className="inline-flex min-h-12 items-center break-all text-base font-semibold text-[#fafafa] underline decoration-white/30 underline-offset-4"
            >
              {JOBS_EMAIL}
            </a>
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
