import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  note?: string;
  strong?: boolean;
};

export default function StatCard({ label, value, icon: Icon, note, strong = false }: StatCardProps) {
  return (
    <article className={strong ? "summary-card summary-card-strong" : "summary-card"}>
      <span className={strong ? "card-icon" : "card-icon card-icon-soft"}>
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <p className="card-title">{label}</p>
      <p className="summary-card-value">{value}</p>
      {note ? <p className="card-copy">{note}</p> : null}
    </article>
  );
}
