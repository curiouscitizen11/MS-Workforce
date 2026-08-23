import Link from "next/link";

export const metadata = {
  title: "About | MS Workforce",
  description: "MS Workforce is a construction labour hire company based on Sydney’s Northern Beaches. Safety, reliability and straightforward service.",
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-navy-50 section-padding">
        <div className="container-narrow">
          <h1 className="text-4xl font-bold text-navy">About MS Workforce</h1>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-narrow max-w-3xl">
          <p className="text-lg text-slate-700 leading-relaxed">
            MS Workforce is a labour hire company based in Queenscliff on
            Sydney’s Northern Beaches.
          </p>
          <p className="mt-6 text-lg text-slate-700 leading-relaxed">
            We specialise in construction and are committed to doing things the
            right way — particularly when it comes to safety, inductions and
            treating people fairly.
          </p>
          <p className="mt-6 text-lg text-slate-700 leading-relaxed">
            We’re just getting started and our focus is simple: supply reliable
            workers, communicate clearly, and build solid working relationships
            with both clients and the people who work with us.
          </p>

          <h2 className="mt-14 text-2xl font-semibold text-navy">
            Our Values
          </h2>
          <div className="mt-8 grid sm:grid-cols-2 gap-6">
            <div className="bg-navy-50 rounded-xl p-6">
              <h3 className="font-semibold text-navy text-lg">Safety</h3>
              <p className="mt-2 text-slate-600">
                Everyone deserves to go home safe. Inductions and safe work
                practices matter.
              </p>
            </div>
            <div className="bg-navy-50 rounded-xl p-6">
              <h3 className="font-semibold text-navy text-lg">Reliability</h3>
              <p className="mt-2 text-slate-600">
                Turning up and doing what we say we’ll do.
              </p>
            </div>
            <div className="bg-navy-50 rounded-xl p-6">
              <h3 className="font-semibold text-navy text-lg">Respect</h3>
              <p className="mt-2 text-slate-600">
                Fair treatment for clients and workers alike.
              </p>
            </div>
            <div className="bg-navy-50 rounded-xl p-6">
              <h3 className="font-semibold text-navy text-lg">Straightforward</h3>
              <p className="mt-2 text-slate-600">
                Clear, honest communication without unnecessary complications.
              </p>
            </div>
          </div>

          <div className="mt-14 text-center">
            <Link href="/contact" className="btn-primary">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
