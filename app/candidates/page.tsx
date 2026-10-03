import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For candidates",
  description:
    "Apply to MS Workforce through the employee portal or by email. We will be in touch when a suitable job comes up.",
};

const lookFor = [
  {
    title: "Attitude and reliability",
    body: "People who turn up and take the work seriously.",
  },
  {
    title: "Experience",
    body: "Construction experience is a plus.",
  },
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
            Beaches. Submit your details in the employee portal, or by email.
            We will be in touch when a suitable job comes up.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href={formUrl} className="pill pill-light w-full sm:w-auto" target="_blank" rel="noopener noreferrer">
              Employee portal
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
          <h2 className="display mt-6">A good attitude, and experience that helps.</h2>
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
          <p className="kicker text-white/50">How to apply</p>
          <h2 className="display mt-6">Employee portal or email.</h2>
          <p className="lede mt-8 text-white/75">
            The employee portal is where workers submit their details. You can
            also email a short summary of your experience. We will be in touch
            when a suitable job comes up.
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
              href="mailto:smoranc.marek@gmail.com"
              className="text-lg font-medium text-white underline decoration-white/30 underline-offset-4 sm:text-2xl break-all"
            >
              smoranc.marek@gmail.com
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
