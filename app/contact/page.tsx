import ContactButtons from "@/components/ContactButtons";
import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icons";
import { EMAIL, EMAIL_HREF, JOBS_EMAIL, JOBS_EMAIL_HREF, REQUEST_LABOUR_HREF, socialMeta } from "@/components/site";

const pageDescription =
  "Request construction labour or ask a question. Builders email hello@msworkforce.au, workers email jobs@msworkforce.au. Greater Sydney sites.";

export const metadata: Metadata = {
  title: { absolute: "Contact MS Workforce | Request Construction Labour" },
  description: pageDescription,
  alternates: { canonical: "/contact" },
  ...socialMeta("/contact", "Contact MS Workforce | Request Construction Labour", pageDescription),
};

const facts: { icon: IconName; label: string; value: string; href?: string }[] = [
  { icon: "mail", label: "Builders", value: EMAIL, href: EMAIL_HREF },
  { icon: "mail", label: "Workers", value: JOBS_EMAIL, href: JOBS_EMAIL_HREF },
  { icon: "pin", label: "Area", value: "Across Sydney, NSW" },
  { icon: "pin", label: "Service area", value: "Greater Sydney" },
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
      <section className="bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">Contact</p>
          <h1 className="display mt-4">Request labour or ask a question.</h1>
          <p className="mt-8 max-w-full text-[clamp(1.5rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight [overflow-wrap:anywhere]">
            <a href={EMAIL_HREF} className="text-teal-300">
              {EMAIL}
            </a>
          </p>
          <p className="lede mt-5 text-body">
            Builders, site managers and trades: email the brief and you will get
            a personal reply. Looking for work? Email{" "}
            <a href={JOBS_EMAIL_HREF} className="text-white underline decoration-white/30 underline-offset-4">
              {JOBS_EMAIL}
            </a>{" "}
            or head to the{" "}
            <Link href="/candidates" className="text-white underline decoration-white/30 underline-offset-4">
              workers page
            </Link>
            .
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href="/portal/book-labour"
              target="_blank"
              rel="noopener noreferrer"
              className="pill pill-teal w-full sm:w-auto"
            >
              Book labour
              <span className="sr-only"> (form opens in a new tab)</span>
            </a>
            <a href={REQUEST_LABOUR_HREF} className="pill pill-line w-full sm:w-auto">
              Email the brief
            </a>
          </div>
          <ContactButtons className="mt-3" />
          <Link
            href="/privacy"
            className="mt-4 inline-flex min-h-11 items-center text-sm text-body underline decoration-white/30 underline-offset-4 hover:text-white"
          >
            How we handle your information
          </Link>
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">Labour requests</p>
          <h2 className="mt-6 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            What to include in a labour request.
          </h2>
          <ul className="mt-8 max-w-3xl grid gap-3 sm:mt-10">
            {include.map((item, index) => (
              <li key={item} className="num-card items-center">
                <span className="num-badge">{index + 1}</span>
                <span className="min-w-0 flex-1 text-lg font-semibold tracking-tight sm:text-2xl">{item}</span>
              </li>
            ))}
          </ul>
          <p className="lede mt-10 text-body">
            The Book labour form asks for each of these. The Email the brief button
            opens an email with the same prompts already filled in.
          </p>
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="wrap py-14 sm:py-20 lg:py-24">
          <p className="kicker text-teal">Details</p>
          <h2 className="display mt-4">Supplying sites across Sydney.</h2>
          <dl className="mt-8 max-w-3xl grid gap-3 sm:mt-10">
            {facts.map((item) => (
              <div key={item.label} className="num-card items-center">
                <Icon name={item.icon} />
                <div className="min-w-0 flex-1">
                <dt className="kicker text-teal">{item.label}</dt>
                <dd className="mt-1 break-words text-lg font-semibold tracking-tight sm:text-2xl">
                  {item.href ? (
                    <a href={item.href} className="text-teal-300">
                      {item.value}
                    </a>
                  ) : (
                    item.value
                  )}
                </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
