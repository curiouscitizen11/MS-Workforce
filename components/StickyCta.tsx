import Link from "next/link";
import { BOOK_LABOUR_URL } from "@/components/site";

export default function StickyCta() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-navy px-4 pt-3 md:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        <a
          href={BOOK_LABOUR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="pill pill-teal w-full px-4"
        >
          Book labour
          <span className="sr-only"> (form opens in a new tab)</span>
        </a>
        <Link href="/candidates#register" className="pill pill-light w-full px-4">
          Apply for work
        </Link>
      </div>
    </div>
  );
}
