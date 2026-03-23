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
      } else {
        setError("Registration failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: "480px", margin: "4rem auto", padding: "1.5rem" }}>
      <h1>Register</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
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

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <p style={{ marginTop: "1rem" }}>
        Already registered? <Link to="/login">Go to login</Link>.
      </p>
    </main>
  );
}
