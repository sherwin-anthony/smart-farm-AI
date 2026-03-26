import axios from "axios";
import { Settings2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import { useAuth } from "../features/auth/AuthContext";
import { updateCurrentUser } from "../features/auth/api";
import { updateCurrentFarm } from "../features/farms/api";

export default function FarmProfilePage() {
  const { user, farm, refreshAuth } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    size_hectares: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        location: farm?.location ?? "",
        size_hectares: farm?.size_hectares?.toString() ?? "",
        notes: farm?.notes ?? "",
      });
    }
  }, [user, farm]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    const hasFarmDetails =
      Boolean(farm) ||
      Boolean(form.location.trim()) ||
      Boolean(form.size_hectares.trim()) ||
      Boolean(form.notes.trim());

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      const requests: Promise<unknown>[] = [
        updateCurrentUser({
          name: form.name,
          email: form.email,
        }),
      ];

      if (hasFarmDetails) {
        requests.push(
          updateCurrentFarm({
            location: form.location || null,
            size_hectares: form.size_hectares.trim() ? Number(form.size_hectares) : null,
            notes: form.notes || null,
          })
        );
      }

      await Promise.all(requests);

      await refreshAuth();
      setMessage("Account and farm details updated.");
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Could not update account settings.");
      } else {
        setError("Could not update account settings.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="Profile"
        description="Update account and farm details inside the refreshed malachite theme with cleaner cards and higher-contrast text."
      />

      {!user ? (
        <section className="panel-card">
          <p>No user details found for this account.</p>
        </section>
      ) : (
        <section className="profile-card">
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="row field-card">
              <div className="inline-icon-row">
                <span className="card-icon card-icon-soft">
                  <UserRound size={18} strokeWidth={2.2} />
                </span>
                <p className="helper-text">Account Details</p>
              </div>
            </div>

            <div className="row">
              <label htmlFor="user-name">Name</label>
              <input
                id="user-name"
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>

            <div className="row">
              <label htmlFor="user-email">Email</label>
              <input
                id="user-email"
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </div>

            <div className="row field-card">
              <div className="inline-icon-row">
                <span className="card-icon card-icon-soft">
                  <Settings2 size={18} strokeWidth={2.2} />
                </span>
                <p className="helper-text">Farm Details</p>
              </div>
            </div>

            <div className="row">
              <label htmlFor="farm-location">Location</label>
              <input
                id="farm-location"
                type="text"
                placeholder="Farm Location"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
              />
            </div>

            <div className="row">
              <label htmlFor="farm-size">Size in Hectares</label>
              <input
                id="farm-size"
                type="number"
                step="0.01"
                placeholder="Farm Size"
                value={form.size_hectares}
                onChange={(event) => setForm({ ...form, size_hectares: event.target.value })}
              />
            </div>

            <div className="row">
              <label htmlFor="farm-notes">Notes</label>
              <textarea
                id="farm-notes"
                rows={4}
                placeholder="Helpful farm notes"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </div>

            <div className="split-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Settings"}
              </button>
            </div>

            {message ? <p className="text-success">{message}</p> : null}
            {error ? <p className="text-danger">{error}</p> : null}
          </form>
        </section>
      )}
    </div>
  );
}
