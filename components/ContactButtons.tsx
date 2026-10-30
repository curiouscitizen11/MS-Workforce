import { PHONE, WHATSAPP } from "@/data/contact";

function digits(value: string) {
  return value.replace(/[^\d+]/g, "");
}

// Renders nothing until a number is set in data/contact.ts.
export default function ContactButtons({ className = "" }: { className?: string }) {
  const phone = PHONE.trim();
  const whatsapp = WHATSAPP.trim();
  if (!phone && !whatsapp) return null;

  // WhatsApp links want digits only, with the country code and no leading + or 0.
  const waNumber = digits(whatsapp).replace(/^\+/, "").replace(/^0/, "61");

  return (
    <div className={"flex flex-col gap-3 sm:flex-row " + className}>
      {phone ? (
        <a href={"tel:" + digits(phone)} className="pill pill-line w-full sm:w-auto">
          Call {phone}
        </a>
      ) : null}
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
