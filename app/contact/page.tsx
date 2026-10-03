import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Email smoranc.marek@gmail.com. Queenscliff on Sydney's Northern Beaches, NSW 2096. Greater Sydney, with first jobs in NSW.",
};

const facts = [
  { label: "Email", value: "smoranc.marek@gmail.com", href: "mailto:smoranc.marek@gmail.com" },
  { label: "Place", value: "Queenscliff / Northern Beaches" },
  { label: "Home office", value: "Queenscliff, NSW 2096" },
  { label: "Service area", value: "Greater Sydney" },
  { label: "First jobs", value: "NSW only" },
];

export default function ContactPage() {
  return (
    <>
      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Contact</p>
          <h1 className="display mt-6">Email us.</h1>
          <p className="mt-8 max-w-full text-[clamp(1.5rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight [overflow-wrap:anywhere]">
            <a href="mailto:smoranc.marek@gmail.com" className="text-teal">
              smoranc.marek@gmail.com
            </a>
          </p>
          <p className="lede mt-8 text-white/70">
            Whether you need workers or you are looking for work, email is the
            way to reach us.
          </p>
        </div>
      </section>

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">Details</p>
          <h2 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Queenscliff. Greater Sydney. NSW first.
          </h2>
          <dl className="mt-14 max-w-3xl border-b border-navy/10">
            {facts.map((item) => (
              <div key={item.label} className="stack-row border-t border-navy/10">
                <dt className="kicker text-navy/45 sm:col-span-4">{item.label}</dt>
                <dd className="text-xl font-medium tracking-tight sm:col-span-8 sm:text-2xl break-words">
                  {item.href ? (
                    <a href={item.href} className="text-teal">
                      {item.value}
                    </a>
                  ) : (
                    item.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">No form yet</p>
          <h2 className="display mt-6">A proper contact form waits.</h2>
          <div className="mt-8 max-w-2xl space-y-6 text-lg leading-relaxed text-white/75">
            <p>
              A proper contact form waits until the company is registered and a
              business email exists. Please email us directly. This page does
              not send a message for you.
            </p>
            <p>Include:</p>
            <ul className="space-y-2">
              <li>Your name</li>
              <li>Whether you need workers or you are looking for work</li>
              <li>A short message about what you need</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
