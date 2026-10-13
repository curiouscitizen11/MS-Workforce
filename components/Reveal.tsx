"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTOR =
  "main section:not(:first-of-type) .wrap > *, main section:not(:first-of-type) li, main section:not(:first-of-type) h2";

export default function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const vh = window.innerHeight;
    const els = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).filter(
      (el) => !el.closest(".reveal") && el.getBoundingClientRect().top > vh * 0.92,
    );

    const io = new IntersectionObserver(
      (entries) => {
        let i = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.style.transitionDelay = `${Math.min(i++, 5) * 70}ms`;
          el.classList.add("is-in");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    for (const el of els) {
      el.classList.add("reveal");
      io.observe(el);
    }
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
