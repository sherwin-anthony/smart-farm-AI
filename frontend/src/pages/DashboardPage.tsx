import {
  Activity,
  Bot,
  CloudSun,
  Leaf,
  MapPinned,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";

const stats = [
  {
    label: "Field health",
    value: "94%",
    note: "Malachite alerts keep the overview calm and readable.",
    icon: Leaf,
    strong: true,
  },
  {
    label: "Plots tracked",
    value: "24",
    note: "Every card follows the same accent system and hover rhythm.",
    icon: MapPinned,
  },
  {
    label: "Weather confidence",
    value: "Stable",
    note: "Quick summaries stay black on light surfaces and white on accents.",
    icon: CloudSun,
  },
  {
    label: "AI guidance",
    value: "Ready",
    note: "Assistant, recommendations, and yield screens now share the same visual language.",
    icon: Bot,
  },
];

const highlights = [
  {
    title: "Clean contrast",
    description: "Body copy stays dark on light surfaces, while strong green cards switch to white text for clear hierarchy.",
    icon: Activity,
  },
  {
    title: "Consistent green system",
    description: "The malachite palette drives buttons, icon shells, borders, pills, and hover states across the app.",
    icon: Sparkles,
    strong: true,
  },
  {
    title: "Motion with purpose",
    description: "Cards lift gently on hover so the interface feels alive without becoming noisy or distracting.",
    icon: TrendingUp,
  },
];

export default function DashboardPage() {
  return (
    <div className="stack">
      <PageHeader
        title="Dashboard"
        description="A cleaner SmartFarm shell built around your malachite palette, stronger contrast, and more expressive cards."
      />

      <section className="module-hero">
        <div className="module-hero-copy">
          <span className="card-chip">System refresh</span>
          <span className="card-icon">
            <Sparkles size={24} strokeWidth={2.2} />
          </span>
          <div>
            <h2>One color language for the whole workspace</h2>
            <p>
              The updated UI now leans on soft mint surfaces, bold malachite actions, and black or white text for a cleaner look.
            </p>
          </div>
        </div>

        <div className="module-actions">
          <button type="button">Review plots</button>
          <button type="button" className="ghost-button">Open profile</button>
        </div>
      </section>

      <section className="grid-cards">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            note={stat.note}
            icon={stat.icon}
            strong={stat.strong}
          />
        ))}
      </section>

      <section className="module-grid">
        {highlights.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className={item.strong ? "feature-card feature-card-strong" : "feature-card"}
            >
              <span className={item.strong ? "card-icon" : "card-icon card-icon-soft"}>
                <Icon size={18} strokeWidth={2.2} />
              </span>
              <h3 className="card-title">{item.title}</h3>
              <p className="card-copy">{item.description}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
