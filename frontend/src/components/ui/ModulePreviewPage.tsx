import { ArrowRight, type LucideIcon } from "lucide-react";
import PageHeader from "./PageHeader";

type PreviewCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  strong?: boolean;
};

type ModulePreviewPageProps = {
  title: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  heroIcon: LucideIcon;
  heroBadge: string;
  heroAction: string;
  cards: PreviewCard[];
};

export default function ModulePreviewPage({
  title,
  description,
  heroTitle,
  heroDescription,
  heroIcon: HeroIcon,
  heroBadge,
  heroAction,
  cards,
}: ModulePreviewPageProps) {
  return (
    <div className="stack">
      <PageHeader title={title} description={description} />

      <section className="module-hero">
        <div className="module-hero-copy">
          <span className="card-chip">{heroBadge}</span>
          <span className="card-icon">
            <HeroIcon size={24} strokeWidth={2.2} />
          </span>
          <div>
            <h2>{heroTitle}</h2>
            <p>{heroDescription}</p>
          </div>
        </div>

        <div className="module-actions">
          <button type="button">
            {heroAction}
          </button>
          <button type="button" className="ghost-button">
            Explore roadmap
          </button>
        </div>
      </section>

      <section className="module-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className={card.strong ? "feature-card feature-card-strong" : "feature-card"}
            >
              <span className={card.strong ? "card-icon" : "card-icon card-icon-soft"}>
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <h3 className="card-title">{card.title}</h3>
              <p className="card-copy">{card.description}</p>
              <span className="card-chip">
                <ArrowRight size={14} strokeWidth={2.2} />
                {card.badge ?? "Ready for next step"}
              </span>
            </article>
          );
        })}
      </section>
    </div>
  );
}
