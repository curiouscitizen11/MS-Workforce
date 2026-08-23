export const metadata = {
  title: "Contact | MS Workforce",
  description: "Contact MS Workforce – construction labour hire on Sydney’s Northern Beaches. Email smoranc.marek@gmail.com",
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-navy-50 section-padding">
        <div className="container-narrow">
          <h1 className="text-4xl font-bold text-navy">Contact Us</h1>
          <p className="mt-4 text-lg text-slate-700 max-w-2xl">
            We’d like to hear from you — whether you’re a client needing
            workers or someone looking for construction opportunities.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-narrow">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact details */}
            <div>
              <h2 className="text-xl font-semibold text-navy">
                Get in touch
              </h2>
              <ul className="mt-6 space-y-4 text-slate-700">
                <li>
                  <span className="block text-sm font-medium text-slate-500">
                    Email
                  </span>
                  <a
                    href="mailto:smoranc.marek@gmail.com"
                    className="text-lg text-teal-600 hover:underline"
                  >
                    smoranc.marek@gmail.com
                  </a>
                </li>
                <li>
                  <span className="block text-sm font-medium text-slate-500">
                    Location
                  </span>
                  <span className="text-lg">
                    Queenscliff / Northern Beaches, Sydney
                  </span>
                </li>
                <li>
                  <span className="block text-sm font-medium text-slate-500">
                    Service area
                  </span>
                  <span className="text-lg">Greater Sydney</span>
                </li>
              </ul>
            </div>

            {/* Simple form note */}
            <div className="bg-navy-50 rounded-xl p-8">
              <h2 className="text-xl font-semibold text-navy">
                Send a message
              </h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                The easiest way right now is to email us directly at{" "}
                <a
                  href="mailto:smoranc.marek@gmail.com"
                  className="text-teal-600 font-medium hover:underline"
                >
                  smoranc.marek@gmail.com
                </a>
                .
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Please include:
              </p>
              <ul className="mt-2 space-y-1 text-slate-600">
                <li>• Your name</li>
                <li>• Whether you’re a client or looking for work</li>
                <li>• A short message about what you need</li>
              </ul>
              <p className="mt-6 text-sm text-slate-500">
                A proper contact form can be added once the company is
                registered and business email is set up.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
