import { useMemo, useState } from "react";
import EmptyState from "../../../components/ui/EmptyState";
import type { FarmPayload } from "../types";
import type { Farm } from "../types";

type FarmListProps = {
  farms: Farm[];
  updatingId: number | null;
  deletingId: number | null;
  onUpdate: (id: number, payload: FarmPayload) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

// Purpose: render the list of saved farms.
// Routing: used inside FarmsPage after GET /api/farms returns data.
export default function FarmList({ farms, updatingId, deletingId, onUpdate, onDelete }: FarmListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState({
    owner_name: "",
    location: "",
    size_hectares: "",
    notes: "",
  });

  const editableFarm = useMemo(
    () => farms.find((farm) => farm.id === editingId) ?? null,
    [editingId, farms]
  );

  const startEditing = (farm: Farm) => {
    setEditingId(farm.id);
    setDraft({
      owner_name: farm.owner_name ?? "",
      location: farm.location ?? "",
      size_hectares: farm.size_hectares?.toString() ?? "",
      notes: farm.notes ?? "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft({
      owner_name: "",
      location: "",
      size_hectares: "",
      notes: "",
    });
  };

  const parseNullableNumber = (value: string): number | null => {
    if (!value.trim()) return null;
    return Number(value);
  };

  const handleUpdate = async () => {
    if (!editableFarm) {
      return;
    }

    const ownerName = draft.owner_name.trim();

    await onUpdate(editableFarm.id, {
      name: ownerName ? `${ownerName}'s Farm` : editableFarm.name,
      owner_name: ownerName || null,
      location: draft.location || null,
      size_hectares: parseNullableNumber(draft.size_hectares),
      notes: draft.notes || null,
    });

    cancelEditing();
  };

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
              {editingId === farm.id ? (
                <div style={{ display: "grid", gap: "0.75rem", minWidth: "280px" }}>
                  <input
                    type="text"
                    placeholder="Owner name"
                    value={draft.owner_name}
                    onChange={(event) => setDraft({ ...draft, owner_name: event.target.value })}
                  />

                  <input
                    type="text"
                    placeholder="Location"
                    value={draft.location}
                    onChange={(event) => setDraft({ ...draft, location: event.target.value })}
                  />

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Size in hectares"
                    value={draft.size_hectares}
                    onChange={(event) => setDraft({ ...draft, size_hectares: event.target.value })}
                  />

                  <textarea
                    rows={4}
                    placeholder="Notes"
                    value={draft.notes}
                    onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                  />
                </div>
              ) : (
                <>
                  <h3 style={{ marginTop: 0 }}>Farm Details</h3>
                  <p style={{ margin: "0.25rem 0" }}>
                    <strong>Owner:</strong> {farm.owner_name || "N/A"}
                  </p>
                  <p style={{ margin: "0.25rem 0" }}>
                    <strong>Location:</strong> {farm.location || "N/A"}
                  </p>
                  <p style={{ margin: "0.25rem 0" }}>
                    <strong>Size:</strong> {farm.size_hectares ?? "N/A"} hectares
                  </p>
                  {farm.notes ? (
                    <p style={{ margin: "0.5rem 0 0" }}>
                      <strong>Notes:</strong> {farm.notes}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              {editingId === farm.id ? (
                <>
                  <button type="button" onClick={handleUpdate} disabled={updatingId === farm.id}>
                    {updatingId === farm.id ? "Saving..." : "Save"}
                  </button>
                  <button type="button" onClick={cancelEditing} disabled={updatingId === farm.id}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => startEditing(farm)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(farm.id)}
                    disabled={deletingId === farm.id}
                  >
                    {deletingId === farm.id ? "Deleting..." : "Delete"}
                  </button>
                </>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
