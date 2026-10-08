import type { Metadata } from "next";
import Link from "next/link";
import { REQUEST_LABOUR_HREF } from "@/components/site";

export const metadata: Metadata = {
  title: "Construction Labour Hire Services Sydney",
  description:
    "General labourers, trade assistants, site cleans and materials handling for builders across Greater Sydney. Day labour, short-notice cover, ongoing supply and project-based crews.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Construction Labour Hire Services Sydney | MS Workforce",
    description:
      "General labourers, trade assistants, site cleans and materials handling for builders across Greater Sydney.",
    url: "/services",
  },
};

const roles = [
  {
    kicker: "01",
    title: "General labourers",
    body: "Reliable labour for site preparation, clean-up, loading and unloading, barrows and back-filling, and the everyday work that keeps a program on track.",
    dark: false,
  },
  {
    kicker: "02",
    title: "Trade assistants",
    body: "Practical support for carpenters, concreters, bricklayers, renderers, tilers and other trades. Fetching, cutting, mixing, carrying and setting up, so your trades stay productive.",
    dark: true,
  },
  {
    kicker: "03",
    title: "Site cleans and site support",
    body: "Progressive cleans through the build, builders cleans before handover, rubbish removal, skip loading and keeping walkways and access clear.",
    dark: false,
  },
  {
    kicker: "04",
    title: "Materials handling",
    body: "Receiving deliveries, stacking and protecting materials, and distributing them around the site and between floors when and where the trades need them.",
    dark: true,
  },
];

const supply = [
  { title: "Day labour", body: "A single day, booked when you need it." },
  { title: "Short-notice cover", body: "For no-shows, pours, deliveries and stages that run long." },
  { title: "Ongoing supply", body: "Regular labour, with the same workers returning wherever possible." },
  { title: "Project-based crews", body: "A crew sized to the stage and adjusted as the program moves." },
];

const sectors = [
  "Residential builders",
  "Renovation and extension builders",
  "Commercial and fit-out contractors",
  "Subcontractors and trades",
];

export default function ServicesPage() {
  return (
    <>
      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Services</p>
          <h1 className="display mt-6">Construction labour hire across Greater Sydney.</h1>
          <p className="lede mt-8 text-white/75">
            General labourers, trade assistants and site support crews for
            builders and trades. Booked by the day, for short-notice cover, or
            supplied on an ongoing, project-based basis.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href={REQUEST_LABOUR_HREF} className="pill pill-light w-full sm:w-auto">
              Request labour
            </a>
            <Link href="/clients" className="pill pill-line w-full sm:w-auto">
              How it works
            </Link>
          </div>
        </div>
      </section>

      {roles.map((item) => (
        <section
          key={item.title}
          className={
            "flex screen items-center " +
            (item.dark ? "bg-navy text-white" : "bg-white text-navy")
          }
        >
          <div className="wrap py-24 sm:py-28">
            <p className={"kicker " + (item.dark ? "text-white/50" : "text-navy/45")}>
              {item.kicker}
            </p>
            <h2 className="display mt-6">{item.title}</h2>
            <p className={"lede mt-8 " + (item.dark ? "text-white/75" : "text-navy/70")}>
              {item.body}
            </p>
          </div>
        </section>
      ))}

      <section className="flex screen items-center bg-white text-navy">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-navy/45">Ways to book</p>
          <h2 className="display mt-6">Short-notice and ongoing supply.</h2>
          <ul className="mt-14 border-b border-navy/10">
            {supply.map((item) => (
              <li key={item.title} className="stack-row border-t border-navy/10">
                <h3 className="text-2xl font-semibold tracking-tight sm:col-span-5 sm:text-3xl">
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed text-navy/70 sm:col-span-7 sm:text-lg">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex screen items-center bg-navy text-white">
        <div className="wrap py-24 sm:py-28">
          <p className="kicker text-white/50">Who we work with</p>
          <h2 className="display mt-6">Built for builders and trades.</h2>
          <ul className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2">
            {sectors.map((item) => (
              <li key={item} className="bg-navy p-6 text-xl font-semibold tracking-tight sm:p-8 sm:text-2xl">
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-12">
            <a href={REQUEST_LABOUR_HREF} className="pill pill-light">
              Request labour
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
