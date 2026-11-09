import Link from "next/link"
import ReplySla from "@/components/ReplySla"
import { EMAIL, EMAIL_HREF, JOBS_EMAIL, JOBS_EMAIL_HREF } from "@/components/site"

/** Shown for every portal address until the portal is switched on. No demo details. */
export default function PortalOpeningSoon() {
  return (
    <section className="bg-navy text-white">
      <div className="wrap section-pad">
        <p className="kicker text-teal">Worker portal</p>
        <h1 className="display mt-4">Portal opening soon</h1>
        <p className="lede mt-6">
          The portal is not open on this site yet. Email us and we will reply.
        </p>
        <p className="mt-8">
          <a href={EMAIL_HREF} className="inline-flex min-h-12 items-center text-h3 font-semibold text-teal-300 [overflow-wrap:anywhere] md:text-h3-desktop">
            {EMAIL}
          </a>
        </p>
        <p className="copy mt-4">
          Looking for work? Email{" "}
          <a href={JOBS_EMAIL_HREF} className="text-teal-300 underline decoration-teal-300/40 underline-offset-4">
            {JOBS_EMAIL}
          </a>
          .
        </p>
        <div className="mt-8">
          <Link href="/contact" className="pill pill-teal w-full sm:w-auto">
            Contact
          </Link>
        </div>
        <ReplySla className="mt-6" />
      </div>
    </section>
  )
}
