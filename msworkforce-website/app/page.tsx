import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-b from-navy-50 to-white section-padding">
        <div className="container-narrow">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-navy tracking-tight leading-tight">
              Reliable Construction Workers for Sydney Sites
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-700 leading-relaxed">
              MS Workforce is a Northern Beaches-based labour hire company
              supplying dependable people for construction projects across
              Sydney.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/clients" className="btn-primary">
                Hire Workers
              </Link>
              <Link href="/candidates" className="btn-secondary">
                Looking for Work?
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-narrow">
          <p className="text-lg text-slate-700 leading-relaxed max-w-3xl">
            We’re a new labour hire business focused on construction. We believe
            good sites run on reliable people, clear communication and a strong
            safety culture. Whether you need workers for an upcoming job or
            you’re looking for construction work yourself, we’re here to help —
            straightforward and without the run-around.
          </p>
        </div>
      </section>

      <section className="section-padding bg-navy-50">
        <div className="container-narrow">
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-navy">Safety First</h3>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Proper inductions, the right tickets, and a genuine focus on
                everyone going home safe.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-navy">Reliable People</h3>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Workers who turn up, follow site rules and get the job done.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-navy">Straightforward Service</h3>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Clear communication and a personal approach from a local company.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-navy text-white">
        <div className="container-narrow text-center">
          <h2 className="text-3xl font-bold">
            Need construction workers or looking for your next role?
          </h2>
          <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
            Get in touch today — we’d be happy to have a chat.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-teal-500 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-teal-400"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
