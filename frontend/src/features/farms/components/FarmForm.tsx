import { useState } from "react";
import type { FarmPayload } from "../types";

type FarmFormProps = {
  onSubmit: (payload: FarmPayload) => Promise<void>;
  submitting: boolean;
};

// Purpose: create-farm form UI.
// Routing: used by FarmsPage, which is loaded by the /farms frontend route.
export default function FarmForm({ onSubmit, submitting }: FarmFormProps) {
  const [form, setForm] = useState({
    owner_name: "",
    location: "",
    size_hectares: "",
    notes: "",
  });

  const parseNullableNumber = (value: string): number | null => {
    if (!value.trim()) return null;
    return Number(value);
  };

  const buildFarmName = () => {
    const ownerName = form.owner_name.trim();
    return ownerName ? `${ownerName}'s Farm` : "My Farm";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      name: buildFarmName(),
      owner_name: form.owner_name || null,
      location: form.location || null,
      size_hectares: parseNullableNumber(form.size_hectares),
      notes: form.notes || null,
    });

    setForm({
      owner_name: "",
      location: "",
      size_hectares: "",
      notes: "",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: "0.75rem",
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: "0.75rem",
        marginBottom: "1rem",
      }}
    >
      <h2 style={{ margin: 0 }}>CREATE YOUR FARM</h2>

      <input
        type="text"
        placeholder="Owner name"
        value={form.owner_name}
        onChange={(event) => setForm({ ...form, owner_name: event.target.value })}
      />

      <input
        type="text"
        placeholder="Location"
        value={form.location}
        onChange={(event) => setForm({ ...form, location: event.target.value })}
      />

      <input
        type="number"
        step="0.01"
        placeholder="Size in hectares"
        value={form.size_hectares}
        onChange={(event) => setForm({ ...form, size_hectares: event.target.value })}
      />

      <textarea
        placeholder="Notes"
        value={form.notes}
        onChange={(event) => setForm({ ...form, notes: event.target.value })}
        rows={4}
      />

      <button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Create"}
      </button>
    </form>
  );
}
