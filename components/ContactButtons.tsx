import { WHATSAPP } from "@/data/contact";
import { businessPhone, CONTACT_LINE, JOBS_MAILTO, telHref } from "@/lib/portal/business-phone";

function digits(value: string) {
  return value.replace(/[^\d+]/g, "");
}

// Call stays hidden until BUSINESS_PHONE is set. The jobs email is shown instead.
export default function ContactButtons({ className = "" }: { className?: string }) {
  const phone = businessPhone();
  const whatsapp = WHATSAPP.trim();

  // WhatsApp links want digits only, with the country code and no leading + or 0.
  const waNumber = digits(whatsapp).replace(/^\+/, "").replace(/^0/, "61");

  return (
    <div className={"flex flex-col gap-3 sm:flex-row " + className}>
      {phone ? (
        <a href={telHref(phone)} className="pill pill-line w-full sm:w-auto">
          Call {phone}
        </a>
      ) : (
        <a href={JOBS_MAILTO} className="inline-flex min-h-12 max-w-full items-center text-base font-semibold text-teal-300 underline underline-offset-4 [overflow-wrap:anywhere]">
          {CONTACT_LINE}
        </a>
      )}
      {whatsapp ? (
        <a
          href={"https://wa.me/" + waNumber}
          target="_blank"
          rel="noopener noreferrer"
          className="pill pill-line w-full sm:w-auto"
        >
          WhatsApp us
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}
    </div>
  );
}
