import Link from "next/link";

export const metadata = {
  title: "Work With Us | MS Workforce",
  description: "Looking for construction work in Sydney? Join MS Workforce – a safety-focused labour hire company on the Northern Beaches.",
};

export default function CandidatesPage() {
  return (
    <>
      <section className="bg-navy-50 section-padding">
        <div className="container-narrow">
          <h1 className="text-4xl font-bold text-navy">Work With Us</h1>
          <p className="mt-4 text-lg text-slate-700 max-w-2xl">
            Looking for construction work in Sydney?
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-narrow max-w-3xl">
          <p className="text-lg text-slate-700 leading-relaxed">
            MS Workforce is building a team of reliable people who take safety
            and site standards seriously. We’re especially interested in people
            with a good attitude, relevant tickets (including White Card), and a
            willingness to follow inductions and site rules.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-navy">What we look for</h3>
              <ul className="mt-3 space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 mt-1">•</span>
                  Good attitude and reliability
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 mt-1">•</span>
                  White Card (and other relevant tickets)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 mt-1">•</span>
                  Willingness to complete site inductions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 mt-1">•</span>
                  Construction experience is a plus
                </li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-navy">How to apply</h3>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Send your details and a short summary of your experience to{" "}
                <a
                  href="mailto:smoranc.marek@gmail.com"
                  className="text-teal-600 font-medium hover:underline"
                >
                  smoranc.marek@gmail.com
                </a>
                , or use the contact form. We’ll be in touch when suitable
                opportunities come up.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/contact" className="btn-primary">
              Register Your Interest
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
