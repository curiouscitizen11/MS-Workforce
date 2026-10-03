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
            Tell us the role, the place and the timing.
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
