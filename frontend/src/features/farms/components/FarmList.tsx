import EmptyState from "../../../components/ui/EmptyState";
import type { Farm } from "../types";

type FarmListProps = {
  farms: Farm[];
  deletingId: number | null;
  onDelete: (id: number) => Promise<void>;
};

// Purpose: render the list of saved farms.
// Routing: used inside FarmsPage after GET /api/farms returns data.
export default function FarmList({ farms, deletingId, onDelete }: FarmListProps) {
  if (farms.length === 0) {
    return (
      <EmptyState
        title="No farms yet"
        description="Create your first farm to start organizing plots, crops, and weather data."
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {farms.map((farm) => (
        <article
          key={farm.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "0.75rem",
            padding: "1rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <h3 style={{ marginTop: 0 }}>{farm.name}</h3>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Owner:</strong> {farm.owner_name || "N/A"}
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Location:</strong> {farm.location || "N/A"}
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Size:</strong> {farm.size_hectares ?? "N/A"} hectares
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Coordinates:</strong> {farm.latitude ?? "N/A"}, {farm.longitude ?? "N/A"}
              </p>
              {farm.notes ? (
                <p style={{ margin: "0.5rem 0 0" }}>
                  <strong>Notes:</strong> {farm.notes}
                </p>
              ) : null}
            </div>

            <div>
              <button
                type="button"
                onClick={() => onDelete(farm.id)}
                disabled={deletingId === farm.id}
              >
                {deletingId === farm.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
