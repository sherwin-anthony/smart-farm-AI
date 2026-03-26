import axios from "axios";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
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
      await login(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Login failed.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <span className="auth-kicker">Welcome Back</span>
          <h1>Sign in to your farm workspace</h1>
          <p className="auth-subtitle">
            Check your farm profile, dashboard snapshots, and the next bits of smart automation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
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

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        {error ? <p className="text-danger auth-helper">{error}</p> : null}

        <p className="auth-helper">
          No account yet? <Link to="/register">Create one here</Link>.
        </p>
      </section>
    </main>
  );
}
