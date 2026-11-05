import ContactButtons from "@/components/ContactButtons";
import type { Metadata } from "next";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icons";
import { EMAIL, EMAIL_HREF, JOBS_EMAIL, JOBS_EMAIL_HREF, REQUEST_LABOUR_HREF, BOOK_LABOUR_URL, socialMeta } from "@/components/site";

const pageDescription =
  "Request construction labour or ask a question. Builders email hello@msworkforce.au, workers email jobs@msworkforce.au. Sites across Greater Sydney.";

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
  { icon: "pin", label: "Service area", value: "Across Greater Sydney" },
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
        <div className="wrap section-pad">
          <p className="kicker text-teal">Contact</p>
          <h1 className="display mt-4">Request labour or ask a question.</h1>
          <p className="mt-8 max-w-full">
            <a href={EMAIL_HREF} className="inline-flex min-h-12 items-center text-h2 font-semibold text-teal-300 [overflow-wrap:anywhere] md:text-h2-desktop">
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
              href={BOOK_LABOUR_URL}
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
            className="mt-3 inline-flex min-h-11 items-center text-small text-body underline decoration-white/30 underline-offset-4 hover:text-white"
          >
            How we handle your information
          </Link>
        </div>
      </section>

      <section className="bg-navy-alt text-white">
        <div className="wrap section-pad">
          <p className="kicker text-teal">Labour requests</p>
          <h2 className="section-title mt-4">
            What to include in a labour request.
          </h2>
          <ul className="card-grid mt-8 max-w-3xl md:mt-10">
            {include.map((item, index) => (
              <li key={item} className="num-card items-center">
                <span className="num-badge">{index + 1}</span>
                <span className="card-title min-w-0 flex-1">{item}</span>
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
        <div className="wrap section-pad">
          <p className="kicker text-teal">Details</p>
          <h2 className="section-title mt-4">Supplying sites across Sydney.</h2>
          <dl className="card-grid mt-8 max-w-3xl md:mt-10">
            {facts.map((item) => (
              <div key={item.label} className="num-card items-center">
                <Icon name={item.icon} />
                <div className="min-w-0 flex-1">
                <dt className="kicker text-teal">{item.label}</dt>
                <dd className="card-title mt-1 break-words">
                  {item.href ? (
                    <a href={item.href} className="inline-flex min-h-11 items-center text-teal-300">
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
