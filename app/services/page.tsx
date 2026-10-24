import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icons";
import { REQUEST_LABOUR_HREF, socialMeta } from "@/components/site";

const pageDescription =
  "General labourers, trade assistants, site cleans and materials handling for builders across Greater Sydney. Day labour to project-based crews.";

export const metadata: Metadata = {
  title: "Construction Labour Hire Services Sydney",
  description: pageDescription,
  alternates: { canonical: "/services" },
  ...socialMeta("/services", "Construction Labour Hire Services Sydney | MS Workforce", pageDescription),
};

const roles: { icon: IconName; kicker: string; title: string; body: string; dark: boolean }[] = [
  {
    icon: "hardhat",
    kicker: "01",
    title: "General labourers",
    body: "Reliable labour for site preparation, clean-up, loading and unloading, barrows and back-filling, and the everyday work that keeps a program on track.",
    dark: false,
  },
  {
    icon: "wrench",
    kicker: "02",
    title: "Trade assistants",
    body: "Practical support for carpenters, concreters, bricklayers, renderers, tilers and other trades. Fetching, cutting, mixing, carrying and setting up, so your trades stay productive.",
    dark: true,
  },
  {
    icon: "sparkle",
    kicker: "03",
    title: "Site cleans and site support",
    body: "Progressive cleans through the build, builders cleans before handover, rubbish removal, skip loading and keeping walkways and access clear.",
    dark: false,
  },
  {
    icon: "package",
    kicker: "04",
    title: "Materials handling",
    body: "Receiving deliveries, stacking and protecting materials, and distributing them around the site and between floors when and where the trades need them.",
    dark: true,
  },
];

const supply: { icon: IconName; title: string; body: string }[] = [
  { icon: "calendar", title: "Day labour", body: "A single day, booked when you need it." },
  { icon: "clock", title: "Short-notice cover", body: "For no-shows, pours, deliveries and stages that run long." },
  { icon: "repeat", title: "Ongoing supply", body: "Regular labour, with the same workers returning wherever possible." },
  { icon: "layers", title: "Project-based crews", body: "A crew sized to the stage and adjusted as the program moves." },
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
      <section className="bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">Services</p>
          <h1 className="display mt-4">Construction labour hire across Greater Sydney.</h1>
          <p className="lede mt-5 text-body">
            General labourers, trade assistants and site support crews for
            builders and trades. Booked by the day, for short-notice cover, or
            supplied on an ongoing, project-based basis.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href={REQUEST_LABOUR_HREF} className="pill pill-teal w-full sm:w-auto">
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
            "" +
            (item.dark ? "bg-navy text-white" : "bg-navy-alt text-white")
          }
        >
          <div className="wrap py-14 sm:py-20 lg:py-24">
            <div className="flex items-center gap-3">
              <Icon name={item.icon} />
              <p className="kicker text-teal">{item.kicker}</p>
            </div>
            <h2 className="display mt-5">{item.title}</h2>
            <p className="lede mt-5 text-body">{item.body}</p>
          </div>
        </section>
      ))}

      <section className="bg-navy-alt text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">Ways to book</p>
          <h2 className="display mt-4">Short-notice and ongoing supply.</h2>
          <ul className="mt-8 grid gap-3 sm:mt-10">
            {supply.map((item) => (
              <li key={item.title} className="num-card">
                <Icon name={item.icon} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{item.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-body sm:text-lg">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">Who we work with</p>
          <h2 className="display mt-4">Built for builders and trades.</h2>
          <ul className="mt-8 grid sm:mt-10 gap-3 sm:grid-cols-2">
            {sectors.map((item) => (
              <li key={item} className="num-card items-center text-lg font-bold tracking-tight sm:text-2xl">
                <Icon name="building" />
                <span className="min-w-0 flex-1">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <a href={REQUEST_LABOUR_HREF} className="pill pill-teal">
              Request labour
            </a>
            <Link href="/labourers-sydney" className="link-quiet link-quiet-light">
              More on labourers in Sydney
            </Link>
            <Link href="/site-cleans-demolition-support" className="link-quiet link-quiet-light">
              More on site cleans and demolition support
            </Link>
            <Link href="/labour-hire-greater-sydney" className="link-quiet link-quiet-light">
              Where we supply: Greater Sydney
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
