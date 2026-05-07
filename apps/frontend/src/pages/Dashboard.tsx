import clsx from "clsx";
import { useLiveSensor } from "../hooks/useLiveSensor";
import { useTheme } from "../hooks/useTheme";
import { SensorCard } from "../components/SensorCard";
import { TemperatureChart } from "../components/TemperatureChart";
import { HistoryTable } from "../components/HistoryTable";
import { AIAnalysis } from "../components/AIAnalysis";
import { ExportButton } from "../components/ExportButton";
import { ThemeToggle } from "../components/ThemeToggle";
import type { ConnectionStatus } from "../types/sensor";

const statusConfig: Record<ConnectionStatus, { label: string; color: string }> = {
  connecting: { label: "Menghubungkan...", color: "text-yellow-400" },
  connected: { label: "Terhubung", color: "text-emerald-400" },
  disconnected: { label: "Reconnecting...", color: "text-red-400" },
};

export function Dashboard() {
  const { sensorData, status } = useLiveSensor();
  const { theme, toggleTheme } = useTheme();
  const conn = statusConfig[status];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Monitoring Ruangan IoT</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Sistem Pemantauan Kondisi Ruangan Real-Time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={clsx("text-xs font-medium flex items-center gap-1.5", conn.color)}>
              <span className={clsx("w-2 h-2 rounded-full inline-block", {
                "bg-yellow-400 animate-pulse": status === "connecting",
                "bg-emerald-400": status === "connected",
                "bg-red-400 animate-pulse": status === "disconnected",
              })} />
              {conn.label}
            </span>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Sensor Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SensorCard
            label="Suhu Ruangan"
            value={sensorData?.suhu ?? null}
            unit="°C"
            icon="🌡️"
            color="blue"
          />
          <SensorCard
            label="Kelembapan"
            value={sensorData?.kelembapan ?? null}
            unit="%"
            icon="💧"
            color="cyan"
          />
          <SensorCard
            label="Pengunjung Hari Ini"
            value={sensorData?.orang_hari_ini ?? null}
            unit="orang"
            icon="👥"
            color="emerald"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Chart (2/3 width) */}
          <div className="lg:col-span-2">
            <TemperatureChart sensorData={sensorData} />
          </div>

          {/* Right Sidebar (1/3 width) */}
          <div className="space-y-4">
            <AIAnalysis sensorData={sensorData} />
            <ExportButton filter="7d" />
            <HistoryTable />
          </div>
        </div>
      </main>
    </div>
  );
}
