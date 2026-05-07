import { Outlet, NavLink } from "react-router-dom";
import { useLiveSensor } from "../hooks/useLiveSensor";
import { useTheme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { SensorContext } from "../context/SensorContext";
import type { ConnectionStatus } from "../types/sensor";

const statusCfg: Record<ConnectionStatus, { label: string; color: string; dot: string; pulse: boolean }> = {
  connecting:   { label: "Menghubungkan", color: "#F5A623", dot: "#F5A623", pulse: true  },
  connected:    { label: "Terhubung",      color: "#5BAD7F", dot: "#5BAD7F", pulse: false },
  disconnected: { label: "Terputus",       color: "#E85454", dot: "#E85454", pulse: true  },
};

const navLinks = [
  { to: "/",      label: "Dashboard",    end: true  },
  { to: "/chat",  label: "AI Chat",      end: false },
  { to: "/rekap", label: "Rekap Harian", end: false },
];

export function Layout() {
  const { sensorData, status } = useLiveSensor();
  const { theme, toggleTheme } = useTheme();
  const conn = statusCfg[status];

  return (
    <SensorContext.Provider value={{ sensorData, status }}>
      <div className="sh-bg" style={{ minHeight: "100vh", color: "var(--text)" }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <header
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="sh-display" style={{ fontSize: "1.5rem" }}>Home Monitor</h1>
              <p className="sh-label mt-0.5" style={{ fontSize: "0.62rem" }}>
                Pemantauan Kondisi Ruangan · Real-Time
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div style={{ position: "relative", width: "8px", height: "8px", flexShrink: 0 }}>
                  <span
                    style={{
                      display: "block",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: conn.dot,
                    }}
                  />
                  {conn.pulse && (
                    <span className="pulse-ring" style={{ color: conn.dot }} />
                  )}
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: conn.color,
                  }}
                >
                  {conn.label}
                </span>
              </div>
              <div style={{ width: "1px", height: "18px", background: "var(--border-hi)", flexShrink: 0 }} />
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </div>

          {/* Nav bar */}
          <div style={{ borderTop: "1px solid var(--border)" }}>
            <div className="max-w-6xl mx-auto px-6">
              <nav className="flex gap-1 py-1.5">
                {navLinks.map(({ to, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    style={({ isActive }) => ({
                      fontFamily: "var(--font-body)",
                      fontSize: "0.78rem",
                      fontWeight: 500,
                      padding: "0.35rem 0.85rem",
                      borderRadius: "8px",
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                      background: isActive ? "var(--accent)" : "transparent",
                      color: isActive ? "#fff" : "var(--text-2)",
                    })}
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </header>

        {/* Page content */}
        <Outlet />
      </div>
    </SensorContext.Provider>
  );
}
