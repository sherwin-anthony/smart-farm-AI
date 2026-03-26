import axios from "axios";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    owner_name: "",
    email: "",
    password: "",
    password_confirmation: "",
    farm_name: "",
    location: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Registration failed.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="auth-kicker">First Setup</span>
          <h1>Create your owner account</h1>
          <p className="auth-subtitle">
            We&apos;ll create your login and your first farm together so the dashboard already knows
            where home base is.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Owner Name"
            value={form.owner_name}
            onChange={(event) => setForm({ ...form, owner_name: event.target.value })}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={form.password_confirmation}
            onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })}
            required
          />

          <input
            type="text"
            placeholder="Farm Name"
            value={form.farm_name}
            onChange={(event) => setForm({ ...form, farm_name: event.target.value })}
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
            {submitting ? "Creating account..." : "Register"}
          </button>
        </form>

        {error ? <p className="text-danger auth-helper">{error}</p> : null}

        <p className="auth-helper">
          Already registered? <Link to="/login">Go to login</Link>.
        </p>
      </section>
    </main>
  );
}
