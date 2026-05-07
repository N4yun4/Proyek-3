import { useLiveSensor } from "../hooks/useLiveSensor";
import { useTheme } from "../hooks/useTheme";
import { SensorCard } from "../components/SensorCard";
import { TemperatureChart } from "../components/TemperatureChart";
import { HistoryTable } from "../components/HistoryTable";
import { AIAnalysis } from "../components/AIAnalysis";
import { ExportButton } from "../components/ExportButton";
import { ThemeToggle } from "../components/ThemeToggle";
import type { ConnectionStatus } from "../types/sensor";

const statusCfg: Record<ConnectionStatus, { label: string; color: string; dotColor: string; pulse: boolean }> = {
  connecting:   { label: "MENGHUBUNGKAN",  color: "#fbbf24", dotColor: "#fbbf24", pulse: true  },
  connected:    { label: "TERHUBUNG",       color: "#34d399", dotColor: "#34d399", pulse: false },
  disconnected: { label: "RECONNECTING",   color: "#f87171", dotColor: "#f87171", pulse: true  },
};

export function Dashboard() {
  const { sensorData, status } = useLiveSensor();
  const { theme, toggleTheme } = useTheme();
  const conn = statusCfg[status];

  return (
    <div className="min-h-screen orbital-bg scanlines" style={{ color: "var(--text)" }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(7,13,28,0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between"
        >
          {/* Brand */}
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, rgba(56,139,253,0.2), rgba(34,211,238,0.1))",
                border: "1px solid rgba(56,139,253,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" stroke="#388bfd" strokeWidth="1" />
                <circle cx="8" cy="8" r="6.5" stroke="#388bfd" strokeWidth="0.6" strokeDasharray="2 2" />
                <path d="M8 1.5V4M8 12v2.5M1.5 8H4M12 8h2.5" stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <h1
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#93c5fd",
                  letterSpacing: "0.12em",
                  lineHeight: 1,
                }}
              >
                ORBITAL
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.6rem",
                  color: "var(--text-2)",
                  letterSpacing: "0.1em",
                  marginTop: "2px",
                  textTransform: "uppercase",
                }}
              >
                Monitoring Ruangan IoT
              </p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div style={{ position: "relative", width: "8px", height: "8px" }}>
                <span
                  style={{
                    display: "block",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: conn.dotColor,
                  }}
                />
                {conn.pulse && (
                  <span
                    className="pulse-ring"
                    style={{ color: conn.dotColor }}
                  />
                )}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.1em",
                  color: conn.color,
                }}
              >
                {conn.label}
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: "1px", height: "20px", background: "var(--border)" }} />

            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* Row 1: Sensor cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SensorCard
            label="Suhu Ruangan"
            value={sensorData?.suhu ?? null}
            unit="°C"
            icon="°"
            color="blue"
          />
          <SensorCard
            label="Kelembapan"
            value={sensorData?.kelembapan ?? null}
            unit="%"
            icon="~"
            color="cyan"
          />
          <SensorCard
            label="Pengunjung Hari Ini"
            value={sensorData?.orang_hari_ini ?? null}
            unit="orang"
            icon="#"
            color="emerald"
          />
        </div>

        {/* Row 2: Chart + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Chart spans 2 cols */}
          <div className="lg:col-span-2 min-h-0">
            <TemperatureChart sensorData={sensorData} />
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <AIAnalysis sensorData={sensorData} />
            <ExportButton filter="7d" />
            <HistoryTable />
          </div>
        </div>

        {/* Footer metadata */}
        <div
          className="orb-divider"
          style={{ marginTop: "0.5rem" }}
        />
        <p
          className="text-center orb-label pb-2"
          style={{ fontSize: "0.58rem" }}
        >
          ORBITAL COMMAND · IOT ROOM MONITOR · POLNES TRK 6C 2025
        </p>
      </main>
    </div>
  );
}
