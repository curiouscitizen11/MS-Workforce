"use client";

import { useEffect, useState } from "react";
export default function StickyCta({ applyHref, bookHref }: { applyHref: string; bookHref: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      // Layout viewport height is steady while the mobile address bar collapses.
      const vh = document.documentElement.clientHeight || window.innerHeight;
      const y = window.scrollY;
      // Roll in after the first screen; hysteresis stops flicker near the line.
      setShown((prev) => (prev ? y > vh * 0.5 : y > vh * 0.8));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      data-shown={shown ? "true" : "false"}
      className="sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-navy px-4 pt-3 md:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        <a
          href={bookHref}
          target={bookHref.startsWith("/") ? "_blank" : undefined}
          rel={bookHref.startsWith("/") ? "noopener noreferrer" : undefined}
          className="pill pill-teal w-full px-4"
        >
          Book labour
          {bookHref.startsWith("/") ? <span className="sr-only"> (form opens in a new tab)</span> : null}
        </a>
        <a href={applyHref} className="pill pill-light w-full px-4">
          Apply for work
        </a>
      </div>
    </div>
  );
}
