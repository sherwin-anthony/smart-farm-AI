import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/farm-profile", label: "Farm Profile" },
  { to: "/farms", label: "Farms" },
  { to: "/plots", label: "Plots" },
  { to: "/crops", label: "Crops" },
  { to: "/tasks", label: "Tasks" },
  { to: "/weather", label: "Weather" },
  { to: "/recommendations", label: "Recommendations" },
  { to: "/yield-predictions", label: "Yield" },
  { to: "/assistant", label: "Assistant" },
];

// Purpose: shared layout for authenticated pages.
// It also shows the current user and provides logout.
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed.", error);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <aside style={{ borderRight: "1px solid #ddd", padding: "1rem" }}>
        <h2>SmartFarm AI</h2>

        <p style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <strong>{user?.name}</strong>
          <br />
          <span>{user?.email}</span>
        </p>

        <nav style={{ display: "grid", gap: "0.5rem", marginTop: "1rem" }}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" onClick={handleLogout} style={{ marginTop: "1rem" }}>
          Logout
        </button>
      </aside>

      <main style={{ padding: "1.5rem" }}>
        <Outlet />
      </main>
    </div>
  );
}
