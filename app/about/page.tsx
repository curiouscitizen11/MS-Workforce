import type { Metadata } from "next";
import { REQUEST_LABOUR_HREF, socialMeta } from "@/components/site";
import Link from "next/link";

const pageDescription =
  "MS Workforce is a construction labour hire business supplying general labourers, trade assistants and site support to builders across Sydney.";

export const metadata: Metadata = {
  title: { absolute: "About MS Workforce | Sydney Construction Labour Hire" },
  description: pageDescription,
  alternates: { canonical: "/about" },
  ...socialMeta("/about", "About MS Workforce | Sydney Construction Labour Hire", pageDescription),
};

const values = [
  {
    title: "Safety",
    body: "We confirm site requirements before every start and act on concerns straight away.",
  },
  {
    title: "Reliability",
    body: "On site, on time, ready to work. If we can't fill a request properly, we say so.",
  },
  {
    title: "Respect",
    body: "Fair treatment and correct pay for workers, and honest dealings with builders.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-teal">About</p>
          <h1 className="display mt-6">Why MS Workforce</h1>
          <div className="mt-8 max-w-2xl space-y-6 text-lg leading-relaxed text-body sm:text-xl">
            <p>
              I&apos;ve spent over five years on Sydney construction sites.
              I&apos;ve seen what a good labourer means to a
              builder&apos;s program, and how much a no-show costs.
            </p>
            <p>
              I started MS Workforce to supply the kind of workers I&apos;d want
              on my own sites: people who turn up on time, know what they&apos;re
              doing and work safely. When you book with us, you deal with me
              directly.
            </p>
          </div>
        </div>
      </section>

      <section className="flex screen items-center bg-navy-alt text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-teal">How we work</p>
          <h2 className="display mt-6">Safety, reliability, respect.</h2>
          <ul className="mt-14 border-b border-navy-line">
            {values.map((item) => (
              <li key={item.title} className="stack-row border-t border-navy-line">
                <h3 className="text-2xl font-semibold tracking-tight sm:col-span-4 sm:text-3xl">
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed text-body sm:col-span-8 sm:text-lg">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <a href={REQUEST_LABOUR_HREF} className="pill pill-teal w-full sm:w-auto">
              Request labour
            </a>
            <Link href="/contact" className="pill pill-line w-full sm:w-auto">
              Contact
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
