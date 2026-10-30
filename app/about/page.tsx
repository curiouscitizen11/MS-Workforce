import type { Metadata } from "next";
import { REQUEST_LABOUR_HREF, socialMeta } from "@/components/site";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icons";

const pageDescription =
  "MS Workforce is a construction labour hire business supplying general labourers, trade assistants and site support to builders across Sydney.";

export const metadata: Metadata = {
  title: { absolute: "About MS Workforce | Sydney Construction Labour Hire" },
  description: pageDescription,
  alternates: { canonical: "/about" },
  ...socialMeta("/about", "About MS Workforce | Sydney Construction Labour Hire", pageDescription),
};

const values: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "hardhat",
    title: "Safety",
    body: "We confirm site requirements before every start and act on concerns straight away.",
  },
  {
    icon: "clock",
    title: "Reliability",
    body: "On site, on time, ready to work. If we can't fill a request properly, we say so.",
  },
  {
    icon: "crew",
    title: "Respect",
    body: "Fair treatment and correct pay for workers, and honest dealings with builders.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">About</p>
          <h1 className="display mt-4">Why MS Workforce</h1>
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

      <section className="bg-navy-alt text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">How we work</p>
          <h2 className="display mt-4">Safety, reliability, respect.</h2>
          <ul className="mt-8 grid gap-3 sm:mt-10">
            {values.map((item) => (
              <li key={item.title} className="num-card">
                <Icon name={item.icon} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{item.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-body sm:text-lg">{item.body}</p>
                </div>
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
