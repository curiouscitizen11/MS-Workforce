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

export default function Footer() {
  return (
    <footer className="relative z-0 bg-navy text-white">
      <div className="wrap pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-10 md:pb-10">
        <div className="grid gap-6 md:grid-cols-12 md:items-start">
          <div className="md:col-span-4">
            <div className="leading-none">
              <div className="text-lg font-semibold tracking-tight">
                MS <span className="text-teal-400">|</span> WORKFORCE
              </div>
              <div className="mt-1 text-[10px] font-medium tracking-[0.2em] text-white/60">
                LABOUR HIRE
              </div>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/65">
              Construction labour hire for builders across Sydney.
            </p>
          </div>

          <nav aria-label="Footer" className="md:col-span-8">
            <h2 className="sr-only">Pages</h2>
            <ul className="grid grid-cols-2 gap-x-4 text-sm text-white/65 md:grid-cols-4">
              {links.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex min-h-11 items-center transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-6 space-y-1 border-t border-[#22354f] pt-5 text-xs text-white/60 md:flex md:justify-between md:space-y-0">
          <p>© {new Date().getFullYear()} MS Workforce</p>
          <p>Supplying construction sites across Greater Sydney, NSW.</p>
        </div>
      </div>
    </footer>
  );
}
