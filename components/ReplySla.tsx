import { REPLY_SLA } from "@/components/publicCopy";

/** The one reply promise, used next to enquire, book and contact actions. */
export default function ReplySla({ className = "" }: { className?: string }) {
  return (
    <p className={"copy " + className}>{REPLY_SLA}</p>
  );
}
