import axios from "axios";
import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { updateCurrentUser } from "../features/auth/api";

export default function FarmProfilePage() {
  const { user, refreshAuth } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
      });
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      await updateCurrentUser({
        name: form.name,
        email: form.email,
      });

      await refreshAuth();
      setMessage("User profile updated.");
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Could not update user profile.");
      } else {
        setError("Could not update user profile.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack">
      {!user ? (
        <section className="panel-card">
          <p>No user details found for this account.</p>
        </section>
      ) : (
        <section className="profile-card">
          <form onSubmit={handleSubmit} className="profile-form">
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

            <div className="split-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Update Profile"}
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
