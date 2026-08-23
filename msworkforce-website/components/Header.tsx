"use client";

import Link from "next/link";
import { useState } from "react";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
  { name: "For Clients", href: "/clients" },
  { name: "For Candidates", href: "/candidates" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <nav className="container-narrow flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex flex-col leading-none">
            <span className="text-2xl font-bold text-navy tracking-tight">
              MS <span className="text-teal-600">|</span> WORKFORCE
            </span>
            <span className="text-xs font-medium tracking-wider text-teal-600 uppercase">
              Labour Hire
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-navy hover:text-teal-600 transition"
            >
              {item.name}
            </Link>
          ))}
          <Link href="/contact" className="btn-primary text-sm px-5 py-2.5">
            Get in Touch
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden p-2 text-navy"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="container-narrow py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-base font-medium text-navy hover:text-teal-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/contact"
              className="btn-primary w-full text-center mt-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get in Touch
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
