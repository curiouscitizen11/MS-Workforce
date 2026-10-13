import Reveal from "@/components/Reveal";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-enter">
      {children}
      <Reveal />
    </div>
  );
}
