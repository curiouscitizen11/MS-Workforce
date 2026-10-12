import Link from "next/link";
import {
  BOOK_LABOUR_URL,
  EMAIL,
  EMAIL_HREF,
  JOBS_EMAIL,
  JOBS_EMAIL_HREF,
  REQUEST_LABOUR_HREF,
} from "@/components/site";

const links = [
  { name: "Services", href: "/services" },
  { name: "Builders", href: "/clients" },
  { name: "Find work", href: "/candidates" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const linkClass = "transition-colors hover:text-white";

export default function Footer() {
  return (
    <footer className="relative z-0 bg-navy text-white">
      <div className="wrap py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="leading-none">
              <div className="text-lg font-semibold tracking-tight">
                MS <span className="text-teal">|</span> WORKFORCE
              </div>
              <div className="mt-1 text-[10px] font-medium tracking-[0.2em] text-white/60">
                LABOUR HIRE
              </div>
            </div>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/65">
              Construction labour hire for builders across Greater Sydney.
              Based on the Northern Beaches.
            </p>
          </div>

          <div className="md:col-span-2">
            <h2 className="kicker text-white/65">Pages</h2>
            <ul className="mt-5 space-y-3 text-sm text-white/80">
              {links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h2 className="kicker text-white/65">Builders</h2>
            <ul className="mt-5 space-y-3 text-sm text-white/80">
              <li>
                <a href={EMAIL_HREF} className="break-all text-teal-300 transition-colors hover:text-white">
                  {EMAIL}
                </a>
              </li>
              <li>
                <a href={BOOK_LABOUR_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Book labour form<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
              <li>
                <a href={REQUEST_LABOUR_HREF} className={linkClass}>
                  Email the brief
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h2 className="kicker text-white/65">Workers</h2>
            <ul className="mt-5 space-y-3 text-sm text-white/80">
              <li>
                <a href={JOBS_EMAIL_HREF} className="break-all text-teal-300 transition-colors hover:text-white">
                  {JOBS_EMAIL}
                </a>
              </li>
              <li>
                <Link href="/candidates#register" className={linkClass}>
                  Register for work
                </Link>
              </li>
              <li>
                <Link href="/candidates#tickets" className={linkClass}>
                  Get your tickets
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} MS Workforce. All rights reserved.</span>
          <span>Supplying construction sites across Greater Sydney, NSW.</span>
        </div>
      </div>
    </footer>
  );
}
