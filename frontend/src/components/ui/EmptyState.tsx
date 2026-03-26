import { Sparkles } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
};

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="panel-card interactive-lift">
      <div className="inline-icon-row">
        <span className="card-icon">
          <Sparkles size={18} strokeWidth={2.2} />
        </span>
        <div>
          <h3>{title}</h3>
          {description ? <p className="card-copy">{description}</p> : null}
        </div>
      </div>
    </section>
  );
}
