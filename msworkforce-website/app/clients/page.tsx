import Link from "next/link";

export const metadata = {
  title: "For Clients | MS Workforce",
  description: "Looking for reliable construction workers in Sydney? MS Workforce offers straightforward labour hire with a focus on safety and clear communication.",
};

export default function ClientsPage() {
  return (
    <>
      <section className="bg-navy-50 section-padding">
        <div className="container-narrow">
          <h1 className="text-4xl font-bold text-navy">For Clients</h1>
          <p className="mt-4 text-lg text-slate-700 max-w-2xl">
            If you’re looking for reliable construction workers, we’d like to
            support you.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-narrow max-w-3xl">
          <p className="text-lg text-slate-700 leading-relaxed">
            As a new company we’re focused on doing the basics well: screening
            people properly, checking tickets and inductions, and staying in
            regular contact so things run smoothly on site. We understand that
            trust is earned through consistency and clear communication.
          </p>

          <h2 className="mt-12 text-2xl font-semibold text-navy">
            How it works
          </h2>
          <ol className="mt-6 space-y-6">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm">
                1
              </span>
              <div>
                <h3 className="font-semibold text-navy">
                  Tell us what you need
                </h3>
                <p className="mt-1 text-slate-600">
                  Role, location, timing and any specific requirements.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm">
                2
              </span>
              <div>
                <h3 className="font-semibold text-navy">
                  We find suitable people
                </h3>
                <p className="mt-1 text-slate-600">
                  We identify available workers who match the role.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm">
                3
              </span>
              <div>
                <h3 className="font-semibold text-navy">
                  Safety and inductions confirmed
                </h3>
                <p className="mt-1 text-slate-600">
                  Relevant tickets and induction requirements are checked.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm">
                4
              </span>
              <div>
                <h3 className="font-semibold text-navy">
                  We stay in touch
                </h3>
                <p className="mt-1 text-slate-600">
                  Ongoing communication throughout the placement.
                </p>
              </div>
            </li>
          </ol>

          <div className="mt-14 bg-navy-50 rounded-xl p-8">
            <p className="text-slate-700 leading-relaxed">
              Happy to discuss your requirements — no pressure, just a
              straightforward conversation.
            </p>
            <div className="mt-6">
              <Link href="/contact" className="btn-primary">
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
