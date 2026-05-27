import axios from "axios";
import { Lightbulb, ScanLine, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import { getRecommendations } from "../features/recommendations/api";

const getErrorMessage = (value: unknown, fallback: string) => {
  // Recommendation errors often come from missing farm/session setup.
  if (axios.isAxiosError(value)) {
    return value.response?.data?.message ?? fallback;
  }

  return fallback;
};

// Purpose: live recommendations page using the authenticated farm context.
export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getRecommendations();
        setRecommendations(response.recommendations);
      } catch (loadError) {
        console.error(loadError);
        setError(getErrorMessage(loadError, "Could not load recommendations."));
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  return (
    <div className="stack">
      <PageHeader
        title="Recommendations"
        description="Farm advice based on your authenticated farm, crop state, and latest weather signal."
      />

      <section className="module-hero">
        <div className="module-hero-copy">
          <span className="card-chip">Decision support</span>
          <span className="card-icon">
            <Lightbulb size={24} strokeWidth={2.2} />
          </span>
          <div>
            <h2>Actionable farm guidance</h2>
            <p>Recommendations are now connected to your actual farm context.</p>
          </div>
        </div>
      </section>

      {loading ? <Loader /> : null}
      {error ? <p className="text-danger">{error}</p> : null}

      {!loading && !error && recommendations.length === 0 ? (
        <EmptyState
          title="No recommendations yet"
          description="Sync weather or add crops to create better recommendation signals."
        />
      ) : null}

      {!loading && !error && recommendations.length > 0 ? (
        <section className="module-grid">
          {recommendations.map((recommendation, index) => {
            const Icon = index === 0 ? ShieldCheck : ScanLine;

            return (
              <article
                key={recommendation}
                className={index === 0 ? "feature-card feature-card-strong" : "feature-card"}
              >
                <span className={index === 0 ? "card-icon" : "card-icon card-icon-soft"}>
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <h3 className="card-title">Recommendation {index + 1}</h3>
                <p className="card-copy">{recommendation}</p>
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
