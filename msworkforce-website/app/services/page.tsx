import Link from "next/link";

export const metadata = {
  title: "Services | MS Workforce",
  description: "Construction labour hire services across Sydney – general labour, site support and flexible project workers.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="bg-navy-50 section-padding">
        <div className="container-narrow">
          <h1 className="text-4xl font-bold text-navy">Our Services</h1>
          <p className="mt-4 text-lg text-slate-700 max-w-2xl">
            MS Workforce supplies construction labour across Sydney, with a
            focus on reliable, site-ready people.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-narrow">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-gray-200 rounded-xl p-8 hover:border-teal-300 transition">
              <h2 className="text-xl font-semibold text-navy">
                General Construction Labour
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Dependable workers for a wide range of construction site tasks.
                People who understand the pace of a site and the importance of
                following instructions and safety rules.
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-8 hover:border-teal-300 transition">
              <h2 className="text-xl font-semibold text-navy">
                Site Support Roles
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Support roles that keep a site running smoothly — including
                general site duties and cleaning. Reliable people who take pride
                in their work.
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-8 hover:border-teal-300 transition">
              <h2 className="text-xl font-semibold text-navy">
                Flexible & Project-Based
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Temporary and project-based workers when you need extra hands
                for a specific period or work package. Straightforward
                arrangements and clear communication.
              </p>
            </div>
          </div>

          <div className="mt-16 bg-navy-50 rounded-xl p-8 md:p-10">
            <h2 className="text-2xl font-semibold text-navy">
              Safety and inductions matter
            </h2>
            <p className="mt-4 text-slate-700 leading-relaxed max-w-3xl">
              Every person we put forward is expected to take safety seriously
              and complete the required inductions. We check relevant tickets
              (including White Card) and keep the process simple for both
              clients and workers.
            </p>
          </div>

          <div className="mt-12 text-center">
            <Link href="/contact" className="btn-primary">
              Discuss Your Requirements
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
