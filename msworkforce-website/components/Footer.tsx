import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="container-narrow py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="text-xl font-bold tracking-tight">
              MS <span className="text-teal-400">|</span> WORKFORCE
            </div>
            <p className="mt-2 text-sm text-gray-300">
              Reliable construction labour hire based on Sydney’s Northern Beaches.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-400">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/services" className="hover:text-teal-300 transition">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/clients" className="hover:text-teal-300 transition">
                  For Clients
                </Link>
              </li>
              <li>
                <Link href="/candidates" className="hover:text-teal-300 transition">
                  For Candidates
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-teal-300 transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-teal-300 transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-teal-400">
              Contact
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li>
                <a
                  href="mailto:smoranc.marek@gmail.com"
                  className="hover:text-teal-300 transition"
                >
                  smoranc.marek@gmail.com
                </a>
              </li>
              <li>Queenscliff / Northern Beaches</li>
              <li>Sydney, NSW</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} MS Workforce. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
