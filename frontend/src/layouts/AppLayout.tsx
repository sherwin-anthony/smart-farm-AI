import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Bot,
  CirclePlus,
  CloudSun,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  Mail,
  Map,
  MoonStar,
  Search,
  Sprout,
  SunMedium,
  UserRound,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { applyTheme, getInitialTheme, persistTheme, type ThemeMode } from "../theme";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/plots", label: "Plots", icon: Map },
  { to: "/crops", label: "Crops", icon: Sprout },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/weather", label: "Weather", icon: CloudSun },
  { to: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { to: "/yield-predictions", label: "Yield", icon: BarChart3 },
];

const tools = [
  { label: "Search", icon: Search },
  { label: "Add", icon: CirclePlus },
  { label: "Alerts", icon: Bell },
  { label: "Mail", icon: Mail },
];

// Purpose: shared layout for authenticated pages.
// It mirrors an admin-shell layout: top-left brand header, top-right toolbar,
// left sidebar, and right content area.
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed.", error);
    }
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const ThemeIcon = theme === "dark" ? SunMedium : MoonStar;
  const themeLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <div className="app-shell">
      <header className="brand-header">
        <div className="brand-mark">
          <Sprout size={20} strokeWidth={2.2} />
        </div>
        <div className="brand-text">
          <strong>SMARTFARM AI</strong>
          <span>Farm workspace</span>
        </div>
      </header>

      <header className="utility-header">
        <div className="utility-left">
          <NavLink
            to="/assistant"
            className={({ isActive }) =>
              isActive ? "utility-assistant utility-assistant-active" : "utility-assistant"
            }
            aria-label="Aura Farming AI"
            title="Aura Farming AI"
          >
            <Bot size={20} strokeWidth={2.2} />
          </NavLink>

          <button
            type="button"
            className="utility-icon utility-theme-toggle"
            onClick={toggleTheme}
            aria-label={themeLabel}
            title={themeLabel}
          >
            <ThemeIcon size={18} strokeWidth={2.2} />
          </button>

          <div className="topbar-link-slot">
            {/* Top navbar links can be added here next. */}
          </div>
        </div>

        <div className="utility-right">
          <div className="utility-actions">
            {tools.map((tool) => (
              <button
                key={tool.label}
                type="button"
                className="utility-icon"
                aria-label={tool.label}
                title={tool.label}
              >
                <tool.icon size={18} strokeWidth={2.2} />
              </button>
            ))}
          </div>

          <div className="profile-menu">
            <button
              type="button"
              className="topbar-profile"
              onClick={() => setIsProfileOpen((open) => !open)}
              aria-label="Open user settings"
            >
              <span className="profile-toggle">
                <UserRound size={18} strokeWidth={2.2} />
              </span>
              <span className="topbar-owner-name">{user?.name ?? "User"}</span>
            </button>

            {isProfileOpen ? (
              <div className="profile-panel">
                <p className="profile-panel-title">Account</p>
                <p>
                  <strong>{user?.name}</strong>
                </p>
                <p className="helper-text">{user?.email}</p>

                <div className="profile-panel-actions">
                  <Link to="/profile" onClick={() => setIsProfileOpen(false)}>
                    View and edit profile
                  </Link>
                  <button type="button" className="secondary-button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <aside className="app-sidebar">
        <nav className="layout-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              <span className="sidebar-link-icon">
                <link.icon size={18} strokeWidth={2.15} />
              </span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="app-main">
        <div className="content-wrap">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
