import { useEffect, useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import { useAuth } from "../features/auth/AuthContext";
import { updateCurrentFarm } from "../features/farms/api";

export default function FarmProfilePage() {
  const { farm, refreshAuth } = useAuth();

  const [form, setForm] = useState({
    name: "",
    location: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (farm) {
      setForm({
        name: farm.name ?? "",
        location: farm.location ?? "",
      });
    }
  }, [farm]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      await updateCurrentFarm({
        name: form.name,
        location: form.location,
      });

      await refreshAuth();
      setMessage("Farm profile updated.");
    } catch (err) {
      console.error(err);
      setError("Could not update farm profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Farm Profile"
        description="View and update the currently authenticated user's farm."
      />

      {!farm ? (
        <p>No farm found for this account.</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "0.75rem",
            maxWidth: "520px",
            border: "1px solid #ddd",
            borderRadius: "0.75rem",
            padding: "1rem",
          }}
        >
          <input
            type="text"
            placeholder="Farm Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />

          <input
            type="text"
            placeholder="Location"
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Update Farm"}
          </button>

          {message ? <p style={{ color: "green" }}>{message}</p> : null}
          {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
        </form>
      )}
    </div>
  );
}
