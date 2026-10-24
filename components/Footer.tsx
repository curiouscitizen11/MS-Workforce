import Link from "next/link";

const links = [
  { name: "Services", href: "/services" },
  { name: "Site cleans", href: "/site-cleans-demolition-support" },
  { name: "Greater Sydney", href: "/labour-hire-greater-sydney" },
  { name: "Builders", href: "/clients" },
  { name: "Apply for work", href: "/candidates" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "Privacy", href: "/privacy" },
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
                MS <span className="text-teal-400">|</span> WORKFORCE
              </div>
              <div className="mt-1 text-[10px] font-medium tracking-[0.2em] text-white/60">
                LABOUR HIRE
              </div>
            </div>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/65">
              Construction labour hire for builders across Sydney.
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

        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/70 sm:flex-row sm:justify-between">
          <span>
            © {new Date().getFullYear()} MS Workforce. All rights reserved. ·{" "}
            <Link href="/privacy" className={linkClass}>Privacy</Link>
          </span>
          <span>Supplying construction sites across Greater Sydney, NSW.</span>
        </div>
      </div>
    </footer>
  );
}
