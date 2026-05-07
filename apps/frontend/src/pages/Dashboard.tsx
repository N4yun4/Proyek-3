import { useSensor } from "../context/SensorContext";
import { SensorCard } from "../components/SensorCard";
import { TemperatureChart } from "../components/TemperatureChart";
import { HistoryTable } from "../components/HistoryTable";
import { AIAnalysis } from "../components/AIAnalysis";
import { ExportButton } from "../components/ExportButton";

function IconTemp() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2.5v7.2" stroke="#4A8FE7" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="13" r="2.5" fill="#4A8FE7" fillOpacity="0.2" stroke="#4A8FE7" strokeWidth="1.4"/>
      <path d="M7 5h4M7 7.5h4" stroke="#4A8FE7" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

function IconHumidity() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 3L5 9.5a4 4 0 1 0 8 0L9 3z" fill="#5BAD7F" fillOpacity="0.15" stroke="#5BAD7F" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}

function IconPeople() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="7" cy="6" r="2.5" stroke="#E8714A" strokeWidth="1.4"/>
      <path d="M2 15c0-3 2.2-5 5-5s5 2 5 5" stroke="#E8714A" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="13" cy="6.5" r="2" stroke="#E8714A" strokeWidth="1.2" opacity="0.6"/>
      <path d="M16 15c0-2.5-1.4-4-3-4.5" stroke="#E8714A" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}

export function Dashboard() {
  const { sensorData } = useSensor();

  return (
    <main className="max-w-6xl mx-auto px-6 py-7 space-y-5">
      {/* Sensor cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="fade-up fade-up-1">
          <SensorCard
            label="Suhu Ruangan"
            value={sensorData?.suhu ?? null}
            unit="°C"
            icon={<IconTemp />}
            color="blue"
          />
        </div>
        <div className="fade-up fade-up-2">
          <SensorCard
            label="Kelembapan"
            value={sensorData?.kelembapan ?? null}
            unit="%"
            icon={<IconHumidity />}
            color="green"
          />
        </div>
        <div className="fade-up fade-up-3">
          <SensorCard
            label="Pengunjung Hari Ini"
            value={sensorData?.orang_hari_ini ?? null}
            unit="orang"
            icon={<IconPeople />}
            color="amber"
          />
        </div>
      </div>

      {/* Chart + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 fade-up fade-up-4">
          <TemperatureChart sensorData={sensorData} />
        </div>
        <div className="flex flex-col gap-4 fade-up fade-up-5">
          <AIAnalysis sensorData={sensorData} />
          <ExportButton filter="7d" />
          <HistoryTable />
        </div>
      </div>

      <p className="text-center sh-label pb-3" style={{ fontSize: "0.6rem" }}>
        Home Monitor · IoT Room Monitoring · POLNES TRK 6C 2025
      </p>
    </main>
  );
}
