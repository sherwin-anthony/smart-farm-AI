import { useCallback, useEffect, useState } from "react";
import { createCrop, getCrops } from "./api/crops";
import type { Crop } from "./types/crop";

function App() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: "",
    status: "planted",
  });

  // Load crops from the backend.
  const loadCrops = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getCrops();
      setCrops(data);
    } catch (err) {
      console.error(err);
      setError("Could not load crops from the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      await createCrop({
        name: form.name,
        type: form.type || undefined,
        status: form.status,
      });

      setForm({
        name: "",
        type: "",
        status: "planted",
      });

      await loadCrops();
    } catch (err) {
      console.error(err);
      setError("Could not create crop.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Smart Farm Frontend</h1>
      <p>React is connected to the Laravel backend.</p>

      <section style={{ marginTop: "2rem" }}>
        <h2>Add Crop</h2>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <input
            type="text"
            placeholder="Crop name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />

          <input
            type="text"
            placeholder="Crop type"
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value })}
          />

          <select
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            <option value="planted">Planted</option>
            <option value="growing">Growing</option>
            <option value="harvested">Harvested</option>
          </select>

          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Add Crop"}
          </button>
        </form>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Crop List</h2>

        {loading && <p>Loading crops...</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {!loading && !error && crops.length === 0 && <p>No crops found yet.</p>}

        {!loading && !error && crops.length > 0 && (
          <ul>
            {crops.map((crop) => (
              <li key={crop.id}>
                <strong>{crop.name}</strong> - {crop.status}
                {crop.type ? ` (${crop.type})` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
