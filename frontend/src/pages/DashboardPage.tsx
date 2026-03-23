import PageHeader from "../components/ui/PageHeader";
import { useAuth } from "../features/auth/AuthContext";

export default function DashboardPage() {
  const { user, farm } = useAuth();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your smart farm overview now follows the authenticated user."
      />

      <div style={{ display: "grid", gap: "1rem" }}>
        <section style={{ border: "1px solid #ddd", borderRadius: "0.75rem", padding: "1rem" }}>
          <h2 style={{ marginTop: 0 }}>Logged-in Owner</h2>
          <p><strong>Name:</strong> {user?.name ?? "N/A"}</p>
          <p><strong>Email:</strong> {user?.email ?? "N/A"}</p>
        </section>

        <section style={{ border: "1px solid #ddd", borderRadius: "0.75rem", padding: "1rem" }}>
          <h2 style={{ marginTop: 0 }}>Current Farm</h2>
          <p><strong>Farm Name:</strong> {farm?.name ?? "No farm found"}</p>
          <p><strong>Location:</strong> {farm?.location ?? "N/A"}</p>
          <p><strong>Owner:</strong> {farm?.owner_name ?? user?.name ?? "N/A"}</p>
        </section>
      </div>
    </div>
  );
}
