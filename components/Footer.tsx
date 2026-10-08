import Link from "next/link";
import { EMAIL, EMAIL_HREF, REQUEST_LABOUR_HREF } from "@/components/site";

const links = [
  { name: "Services", href: "/services" },
  { name: "Builders", href: "/clients" },
  { name: "Find work", href: "/candidates" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="relative z-0 bg-navy text-white">
      <div className="wrap py-16 sm:py-20">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
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
              General labourers, trade assistants and site support, on site
              when you need them.
            </p>
          </div>

          <div className="md:col-span-3">
            <h2 className="kicker text-white/45">Pages</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-white/80 hover:text-white">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <h2 className="kicker text-white/45">Contact</h2>
            <ul className="mt-5 space-y-3 text-sm text-white/75">
              <li>
                <a href={EMAIL_HREF} className="break-all text-teal hover:text-white">
                  {EMAIL}
                </a>
              </li>
              <li>Based on the Northern Beaches</li>
              <li>Supplying sites across Greater Sydney</li>
              <li>
                <a href={REQUEST_LABOUR_HREF} className="font-medium text-white hover:text-teal">
                  Request labour
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-6 text-xs text-white/45">
          © {new Date().getFullYear()} MS Workforce. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
