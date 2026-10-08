import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL, EMAIL_HREF, REQUEST_LABOUR_HREF } from "@/components/site";

export const metadata: Metadata = {
  title: "Contact MS Workforce",
  description:
    "Request construction labour or ask a question. Email MS Workforce at smoranc.marek@gmail.com. Based on Sydney's Northern Beaches, supplying sites across Greater Sydney.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact MS Workforce",
    description: "Request construction labour across Greater Sydney, or ask a question.",
    url: "/contact",
  },
};

const facts = [
  { label: "Email", value: EMAIL, href: EMAIL_HREF },
  { label: "Based", value: "Northern Beaches, Sydney" },
  { label: "Service area", value: "Greater Sydney" },
];

const include = [
  "Site address or suburb",
  "Start date and time",
  "Roles and number of workers",
  "Expected duration",
  "Site contact name and phone",
  "PPE, access and parking notes",
];

export default function ContactPage() {
  return (
    <>
      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Contact</p>
          <h1 className="display mt-6">Request labour or ask a question.</h1>
          <p className="mt-8 max-w-full text-[clamp(1.5rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight [overflow-wrap:anywhere]">
            <a href={EMAIL_HREF} className="text-teal">
              {EMAIL}
            </a>
          </p>
          <p className="lede mt-8 text-white/70">
            Builders, site managers and trades: email the brief and you will get
            a personal reply. Looking for work? Head to the{" "}
            <Link href="/candidates" className="text-white underline decoration-white/30 underline-offset-4">
              workers page
            </Link>
            .
          </p>
          <div className="mt-10">
            <a href={REQUEST_LABOUR_HREF} className="pill pill-light">
              Request labour
            </a>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">Labour requests</p>
          <h2 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            What to include in a labour request.
          </h2>
          <ul className="mt-14 max-w-3xl border-b border-navy/10">
            {include.map((item, index) => (
              <li key={item} className="stack-row border-t border-navy/10">
                <span className="kicker text-navy/40 sm:col-span-2">0{index + 1}</span>
                <span className="text-xl font-medium tracking-tight sm:col-span-10 sm:text-2xl">{item}</span>
              </li>
            ))}
          </ul>
          <p className="lede mt-10 text-navy/70">
            The Request labour button opens an email with these prompts already
            filled in.
          </p>
        </div>
      </section>

      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Details</p>
          <h2 className="display mt-6">Northern Beaches based. Greater Sydney wide.</h2>
          <dl className="mt-14 max-w-3xl border-b border-white/10">
            {facts.map((item) => (
              <div key={item.label} className="stack-row border-t border-white/10">
                <dt className="kicker text-white/50 sm:col-span-4">{item.label}</dt>
                <dd className="break-words text-xl font-medium tracking-tight sm:col-span-8 sm:text-2xl">
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
    </>
  );
}
