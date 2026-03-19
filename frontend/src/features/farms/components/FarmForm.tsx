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
    name: "",
    owner_name: "",
    location: "",
    latitude: "",
    longitude: "",
    size_hectares: "",
    notes: "",
  });

  const parseNullableNumber = (value: string): number | null => {
    if (!value.trim()) return null;
    return Number(value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      name: form.name,
      owner_name: form.owner_name || null,
      location: form.location || null,
      latitude: parseNullableNumber(form.latitude),
      longitude: parseNullableNumber(form.longitude),
      size_hectares: parseNullableNumber(form.size_hectares),
      notes: form.notes || null,
    });

    setForm({
      name: "",
      owner_name: "",
      location: "",
      latitude: "",
      longitude: "",
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
      <h2 style={{ margin: 0 }}>Add Farm</h2>

      <input
        type="text"
        placeholder="Farm name"
        value={form.name}
        onChange={(event) => setForm({ ...form, name: event.target.value })}
        required
      />

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
        step="0.0000001"
        placeholder="Latitude"
        value={form.latitude}
        onChange={(event) => setForm({ ...form, latitude: event.target.value })}
      />

      <input
        type="number"
        step="0.0000001"
        placeholder="Longitude"
        value={form.longitude}
        onChange={(event) => setForm({ ...form, longitude: event.target.value })}
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
        {submitting ? "Saving..." : "Create Farm"}
      </button>
    </form>
  );
}
