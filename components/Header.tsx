"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ReplySla from "@/components/ReplySla";

const pages = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
  { name: "Builders", href: "/clients" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

function NavItem({
  href,
  className,
  children,
  current,
  onClick,
  newTab = false,
}: {
  href: string
  className: string
  children: React.ReactNode
  current?: boolean
  onClick?: () => void
  newTab?: boolean
}) {
  const blank = newTab && href.startsWith("/")
  if (href.startsWith("/") && !blank) {
    return (
      <Link href={href} className={className} aria-current={current ? "page" : undefined} onClick={onClick}>
        {children}
      </Link>
    )
  }
  return (
    <a
      href={href}
      className={className}
      onClick={onClick}
      target={blank ? "_blank" : undefined}
      rel={blank ? "noopener noreferrer" : undefined}
    >
      {children}
      {blank ? <span className="sr-only"> (form opens in a new tab)</span> : null}
    </a>
  )
}

export default function Header({ applyHref, bookHref }: { applyHref: string; bookHref: string }) {
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
    <header className="fixed inset-x-0 top-0 z-50 h-[var(--site-header-height)] bg-navy text-white border-b border-[#22354f]">
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
            className="flex min-h-11 flex-col justify-center leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
          >
            <span className="block text-[19px] font-semibold tracking-tight">
              MS <span className="text-teal-400">|</span> WORKFORCE
            </span>
            <span className="mt-1 block text-[11px] font-medium tracking-[0.2em] text-white/70">
              LABOUR HIRE
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {pages.map((item) => {
            const current = pathname === item.href;
            return (
              <NavItem
                key={item.href}
                href={item.href}
                current={current}
                className={
                  "border-b-2 pb-0.5 text-[13px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal " +
                  (current
                    ? "border-teal text-white"
                    : "border-transparent text-white/70 hover:text-white")
                }
              >
                {item.name}
              </NavItem>
            );
          })}
          <NavItem
            href={applyHref}
            className="border-b-2 border-transparent pb-0.5 text-[13px] font-medium text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
          >
            Apply for work
          </NavItem>
          <NavItem
            href={bookHref}
            newTab
            className="hidden min-h-11 items-center rounded-full bg-teal-400 px-5 text-sm font-semibold text-navy transition hover:bg-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal lg:inline-flex"
          >
            Book labour
          </NavItem>
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
          className="fixed bottom-0 left-0 top-[var(--site-header-height)] z-40 w-[88%] max-w-sm overflow-y-auto border-r border-teal-400 bg-[#0e2240] px-6 py-8 text-left md:hidden"
        >
          <ul className="space-y-1">
            {pages.map((item) => {
              const current = pathname === item.href;
              return (
                <li key={item.href}>
                  <NavItem
                    href={item.href}
                    current={current}
                    onClick={() => setOpen(false)}
                    className={
                      "block rounded-none border-l-[3px] px-3 py-3 text-3xl font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal " +
                      (current
                        ? "border-teal text-white"
                        : "border-transparent text-white/70")
                    }
                  >
                    {item.name}
                  </NavItem>
                </li>
              );
            })}
            <li>
              <NavItem
                href={applyHref}
                onClick={() => setOpen(false)}
                className="block rounded-none border-l-[3px] border-transparent px-3 py-3 text-3xl font-semibold tracking-tight text-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
              >
                Apply for work
              </NavItem>
            </li>
          </ul>
          <NavItem href={bookHref} newTab onClick={() => setOpen(false)} className="pill pill-teal mt-8 w-full">
            Book labour
          </NavItem>
          <ReplySla className="mt-4" />
        </nav>
      ) : null}
    </header>
  );
}
