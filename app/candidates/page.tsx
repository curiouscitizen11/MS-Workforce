import type { Metadata } from "next";
import { EMAIL, WORK_ENQUIRY_HREF } from "@/components/site";

export const metadata: Metadata = {
  title: "Construction Jobs in Sydney",
  description:
    "Looking for construction labouring work across Greater Sydney? Register with MS Workforce through the employee portal for general labouring, trade assistant and site support work.",
  alternates: { canonical: "/candidates" },
  openGraph: {
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
