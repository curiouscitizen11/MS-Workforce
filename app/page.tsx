import Link from "next/link";

const supply = [
  {
    title: "General construction labour",
    body: "Workers for general construction tasks on site.",
  },
  {
    title: "Site support",
    body: "General site duties and cleaning, and other support work on site.",
  },
  {
    title: "Flexible or project-based cover",
    body: "People for a set period, or for a particular piece of work.",
  },
];

const tickets = [
  {
    name: "White card",
    note: "Expected. We record the number and the expiry. This is the baseline.",
  },
  { name: "Work at heights", note: "Recorded." },
  { name: "Asbestos class A", note: "Recorded." },
  { name: "Asbestos class B", note: "Recorded." },
  { name: "Confined space", note: "Recorded." },
  { name: "Driver licence", note: "Recorded." },
  { name: "First aid", note: "Recorded." },
];

const before = [
  { name: "Right to work", note: "Checked before anyone is placed." },
  { name: "Tickets", note: "Sighted before anyone is placed." },
  { name: "Site induction", note: "Done before anyone starts." },
];

export default function HomePage() {
  return (
    <>
      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Sydney sites</p>
          <h1 className="display mt-6">Construction labour for Sydney sites.</h1>
          <p className="lede mt-8 text-white/75">
            MS Workforce is a new construction labour hire business. The home
            office is in Queenscliff, NSW 2096, on Sydney&apos;s Northern
            Beaches. We are just getting started, and we are focused on doing
            the basics well.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/clients" className="pill pill-light w-full sm:w-auto">
              Hire workers
            </Link>
            <Link href="/candidates" className="pill pill-line w-full sm:w-auto">
              Looking for work
            </Link>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">What we supply</p>
          <h2 className="display mt-6">Three kinds of cover.</h2>
          <ul className="mt-14 border-b border-navy/10">
            {supply.map((item, index) => (
              <li key={item.title} className="stack-row border-t border-navy/10">
                <span className="kicker text-navy/40 sm:col-span-3">
                  0{index + 1}
                </span>
                <div className="sm:col-span-9">
                  <h3 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-base leading-relaxed text-navy/70 sm:text-lg">
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
          <p className="kicker text-white/50">Tickets we check</p>
          <h2 className="display mt-6">White card is the baseline.</h2>
          <ul className="mt-14 max-w-3xl border-b border-white/15">
            {tickets.map((item) => (
              <li key={item.name} className="stack-row border-t border-white/15">
                <h3 className="text-xl font-semibold tracking-tight sm:col-span-5 sm:text-2xl">
                  {item.name}
                </h3>
                <p className="text-base leading-relaxed text-white/70 sm:col-span-7">
                  {item.note}
                </p>
              </li>
            ))}
          </ul>
          <p className="lede mt-12 text-white/75">
            Work at heights, confined space, and asbestos work only go to
            someone who holds that ticket. Scaffold work only goes ahead with a
            ticketed scaffolder. We do not offer demolition or asbestos removal
            as a general service. We only put someone forward for that work
            when they hold the ticket. That is a condition of the work, not a
            list of people already on our books.
          </p>
        </div>
      </section>

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">Before a person starts</p>
          <h2 className="display mt-6">Three checks. Every time.</h2>
          <p className="lede mt-8 text-navy/70">
            Before anyone is placed, right to work is checked, tickets are
            sighted, and the site induction is done.
          </p>
          <ul className="mt-14 max-w-3xl border-b border-navy/10">
            {before.map((item, index) => (
              <li key={item.name} className="stack-row border-t border-navy/10">
                <span className="kicker text-navy/40 sm:col-span-2">
                  0{index + 1}
                </span>
                <h3 className="text-2xl font-semibold tracking-tight sm:col-span-4 sm:text-3xl">
                  {item.name}
                </h3>
                <p className="text-base leading-relaxed text-navy/70 sm:col-span-6">
                  {item.note}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Where we work</p>
          <h2 className="display mt-6">Queenscliff, then Greater Sydney.</h2>
          <p className="lede mt-8 text-white/75">
            The home office is in Queenscliff, NSW 2096, on Sydney&apos;s
            Northern Beaches. We can supply labour across Greater Sydney. First
            jobs are in NSW only.
          </p>
        </div>
      </section>

      <section className="grid screen grid-rows-2 bg-white md:grid-cols-2 md:grid-rows-1">
        <Link
          href="/clients"
          className="flex flex-col justify-end border-b border-navy/10 px-5 py-16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-teal sm:px-10 md:border-b-0 md:border-r"
        >
          <p className="kicker text-navy/45">Hire workers</p>
          <h2 className="mt-4 max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">
            Tell us the role, the place, the timing and the tickets.
          </h2>
          <span className="mt-8 text-sm font-medium text-teal">For clients</span>
        </Link>
        <Link
          href="/candidates"
          className="flex flex-col justify-end px-5 py-16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-teal sm:px-10"
        >
          <p className="kicker text-navy/45">Looking for work</p>
          <h2 className="mt-4 max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">
            Send your details. We will be in touch when a suitable job comes up.
          </h2>
          <span className="mt-8 text-sm font-medium text-teal">For candidates</span>
        </Link>
      </section>
    </>
  );
}
