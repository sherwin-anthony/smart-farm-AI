import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/farms", label: "Farms" },
  { to: "/plots", label: "Plots" },
  { to: "/crops", label: "Crops" },
  { to: "/tasks", label: "Tasks" },
  { to: "/weather", label: "Weather" },
  { to: "/recommendations", label: "Recommendations" },
  { to: "/yield-predictions", label: "Yield" },
  { to: "/assistant", label: "Assistant" },
];

export default function AppLayout() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <aside style={{ borderRight: "1px solid #ddd", padding: "1rem" }}>
        <h2>SmartFarm AI</h2>
        <nav style={{ display: "grid", gap: "0.5rem", marginTop: "1rem" }}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main style={{ padding: "1.5rem" }}>
        <Outlet />
      </main>
    </div>
  );
}
