"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BOOK_LABOUR_URL } from "@/components/site";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
  { name: "Builders", href: "/clients" },
  { name: "Find work", href: "/candidates" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[var(--site-header-height)] bg-navy text-white shadow-[inset_0_-1px_0_rgba(51,191,175,0.22)]">
      <div className="wrap flex h-full items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="-ml-3 inline-flex h-11 w-11 flex-none items-center justify-center rounded-full text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              {open ? (
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
          <Link
            href="/"
            className="block leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
          >
            <span className="block text-[19px] font-semibold tracking-tight">
              MS <span className="text-teal">|</span> WORKFORCE
            </span>
            <span className="mt-1 block text-[11px] font-medium tracking-[0.2em] text-white/70">
              LABOUR HIRE
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {navigation.map((item) => {
            const current = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={
                  "border-b-2 pb-0.5 text-[13px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal " +
                  (current
                    ? "border-teal text-white"
                    : "border-transparent text-white/70 hover:text-white")
                }
              >
                {item.name}
              </Link>
            );
          })}
          <a
            href={BOOK_LABOUR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center rounded-full bg-teal-400 px-5 text-sm font-semibold text-navy transition hover:bg-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal lg:inline-flex"
          >
            Book labour
          </a>
        </nav>
      </div>

      {open ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="fixed bottom-0 right-0 top-[var(--site-header-height)] z-30 w-full bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="fixed bottom-0 left-0 top-[var(--site-header-height)] z-40 w-[88%] max-w-sm overflow-y-auto border-r border-white/10 bg-navy px-6 py-8 text-left shadow-2xl md:hidden"
        >
          <ul className="space-y-1">
            {navigation.map((item) => {
              const current = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={
                      "block rounded-2xl border-l-4 px-3 py-3 text-3xl font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal " +
                      (current
                        ? "border-teal text-white"
                        : "border-transparent text-white/70")
                    }
                    onClick={() => setOpen(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          <a
            href={BOOK_LABOUR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pill pill-teal mt-8 w-full"
            onClick={() => setOpen(false)}
          >
            Book labour
          </a>
        </nav>
      ) : null}
    </header>
  );
}
