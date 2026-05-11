import { useState } from "react";
import { useSensor } from "../context/SensorContext";
import { useHistory } from "../hooks/useHistory";
import { useDayReadings } from "../hooks/useDayReadings";
import { TemperatureChart } from "../components/TemperatureChart";
import { downloadCSV } from "../api/export";
import { filterToDates, todayString } from "../utils/dateUtils";
import { fetchAnalyzeSecurity } from "../api/ai";
import type { HistoryFilter, SensorReading } from "../types/sensor";

const FILTERS: { label: string; value: HistoryFilter }[] = [
  { label: "7 Hari",  value: "7d"  },
  { label: "30 Hari", value: "30d" },
  { label: "Semua",   value: "all" },
];

export function RekapPage() {
  const { sensorData } = useSensor();
  const [filter, setFilter] = useState<HistoryFilter>("7d");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const [detailExportStatus, setDetailExportStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const [securityAnalysis, setSecurityAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { data, loading, error } = useHistory(filter);
  const { data: dayReadings, loading: dayLoading } = useDayReadings(selectedDate);

  const today = todayString();
  const selectedEntry = data.find((e) => e.tanggal === selectedDate);

  async function handleExport() {
    setExportStatus("loading");
    try {
      const { from, to } = filterToDates(filter);
      const result = await downloadCSV(from, to);
      setExportStatus(result === "empty" ? "empty" : "idle");
      if (result === "empty") setTimeout(() => setExportStatus("idle"), 3000);
    } catch {
      setExportStatus("error");
      setTimeout(() => setExportStatus("idle"), 3000);
    }
  }

  async function handleDetailExport(date: string) {
    setDetailExportStatus("loading");
    try {
      const result = await downloadCSV(date, date);
      setDetailExportStatus(result === "empty" ? "empty" : "idle");
      if (result === "empty") setTimeout(() => setDetailExportStatus("idle"), 3000);
    } catch {
      setDetailExportStatus("error");
      setTimeout(() => setDetailExportStatus("idle"), 3000);
    }
  }

  function toggleDate(date: string) {
    if (selectedDate !== date) setSecurityAnalysis(null);
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  async function handleAnalyzeSecurity() {
    if (!selectedDate || dayReadings.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await fetchAnalyzeSecurity(selectedDate, dayReadings);
      setSecurityAnalysis(result);
    } catch (err) {
      console.error(err);
      setSecurityAnalysis("Gagal memuat analisis keamanan.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-7 space-y-4">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="sh-label mb-0.5" style={{ fontSize: "0.62rem" }}>Statistik Harian</p>
          <h2 className="sh-display" style={{ fontSize: "1.5rem" }}>Rekap Harian</h2>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {exportStatus === "empty" && (
            <span className="sh-label" style={{ fontSize: "0.62rem", color: "var(--amber)" }}>Tidak ada data</span>
          )}
          {exportStatus === "error" && (
            <span className="sh-label" style={{ fontSize: "0.62rem", color: "var(--red)" }}>Export gagal</span>
          )}
          <button
            onClick={() => void handleExport()}
            disabled={exportStatus === "loading"}
            className={`sh-btn ${exportStatus === "loading" ? "sh-btn-disabled" : "sh-btn-primary"}`}
            style={{ fontSize: "0.78rem", padding: "0.5rem 1rem", borderRadius: "10px" }}
          >
            {exportStatus === "loading" ? (
              "Menyiapkan…"
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 1v7M3 5.5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Export CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setSelectedDate(null); }}
            className={`sh-chip ${filter === f.value ? "sh-chip-active" : "sh-chip-inactive"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="sh-card" style={{ overflow: "hidden" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="sh-label text-left" style={{ padding: "0.85rem 1.25rem", fontSize: "0.62rem" }}>
                Tanggal
              </th>
              <th className="sh-label text-right" style={{ padding: "0.85rem 1.25rem", fontSize: "0.62rem" }}>
                Total Pengunjung
              </th>
              <th style={{ padding: "0.85rem 1.25rem", width: "50px" }} />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="sh-label text-center" style={{ padding: "2.5rem", fontSize: "0.65rem" }}>
                  memuat data…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={3} style={{ padding: "2.5rem", textAlign: "center", color: "var(--red)", fontSize: "0.8rem", fontFamily: "var(--font-body)" }}>
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && data.length === 0 && (
              <tr>
                <td colSpan={3} className="sh-label text-center" style={{ padding: "2.5rem", fontSize: "0.65rem" }}>
                  belum ada data
                </td>
              </tr>
            )}
            {!loading && !error && data.map((entry) => {
              const isSelected = selectedDate === entry.tanggal;
              const isToday = entry.tanggal === today;
              return (
                <tr
                  key={entry.tanggal}
                  className="data-row"
                  onClick={() => toggleDate(entry.tanggal)}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent",
                    background: isSelected ? "var(--surface-2)" : undefined,
                  }}
                >
                  <td style={{ padding: "0.85rem 1.25rem", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--text)" }}>
                    {entry.tanggal}
                    {isToday && (
                      <span
                        className="sh-label"
                        style={{
                          marginLeft: "0.5rem",
                          fontSize: "0.58rem",
                          color: "var(--accent)",
                          background: "rgba(232,113,74,0.1)",
                          padding: "0.1rem 0.45rem",
                          borderRadius: "20px",
                        }}
                      >
                        Hari ini
                      </span>
                    )}
                  </td>
                  <td
                    className="text-right tabular-nums"
                    style={{ padding: "0.85rem 1.25rem", fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 600, color: "#5BAD7F" }}
                  >
                    {entry.total}
                  </td>
                  <td style={{ padding: "0.85rem 1.25rem", textAlign: "center" }}>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--text-3)",
                        display: "inline-block",
                        transform: isSelected ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      ▼
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selectedDate && (
        <div className="sh-card p-6 fade-up fade-up-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="sh-label mb-0.5" style={{ fontSize: "0.6rem" }}>Detail Rekap</p>
              <h3
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--text)",
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                {selectedDate}
                {selectedDate === today && (
                  <span className="sh-label" style={{ marginLeft: "0.5rem", fontSize: "0.58rem", color: "var(--accent)" }}>
                    • Hari ini
                  </span>
                )}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {detailExportStatus === "empty" && (
                <span className="sh-label" style={{ fontSize: "0.62rem", color: "var(--amber)" }}>Tidak ada data</span>
              )}
              {detailExportStatus === "error" && (
                <span className="sh-label" style={{ fontSize: "0.62rem", color: "var(--red)" }}>Export gagal</span>
              )}
              <button
                onClick={() => void handleDetailExport(selectedDate)}
                disabled={detailExportStatus === "loading"}
                className={`sh-btn ${detailExportStatus === "loading" ? "sh-btn-disabled" : "sh-btn-ghost"}`}
                style={{ fontSize: "0.72rem", padding: "0.3rem 0.75rem" }}
              >
                {detailExportStatus === "loading" ? "Menyiapkan…" : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M6 1v7M3 5.5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    CSV
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-2)",
                  fontSize: "1.2rem",
                  lineHeight: 1,
                  padding: "0.25rem 0.5rem",
                  borderRadius: "6px",
                }}
              >
                ×
              </button>
            </div>
          </div>

          <div className="sh-divider mb-5" />

          {/* AI Security Log Section */}
          <div 
            className="mb-6 p-4 rounded-2xl border border-dashed" 
            style={{ 
              borderColor: "rgba(232,113,74,0.3)", 
              background: "rgba(232,113,74,0.03)" 
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ 
                    background: "var(--accent)",
                    boxShadow: "0 0 8px var(--accent)",
                    animation: "pulse 2s infinite"
                  }} 
                />
                <span className="sh-label" style={{ fontSize: "0.6rem", color: "var(--accent)", letterSpacing: "0.05em" }}>
                  AI SECURITY LOG
                </span>
              </div>
              <button 
                onClick={() => void handleAnalyzeSecurity()}
                disabled={isAnalyzing || dayReadings.length === 0}
                className={`sh-btn ${isAnalyzing ? "sh-btn-disabled" : "sh-btn-ghost"}`}
                style={{ fontSize: "0.58rem", padding: "0.2rem 0.6rem", height: "auto" }}
              >
                {isAnalyzing ? "Menganalisis..." : "Cek Keamanan AI"}
              </button>
            </div>
            
            {securityAnalysis ? (
              <div className="fade-in">
                <p 
                  style={{ 
                    fontSize: "0.82rem", 
                    fontFamily: "var(--font-body)", 
                    color: "var(--text-2)", 
                    lineHeight: "1.5",
                    margin: 0,
                    fontStyle: "italic"
                  }}
                >
                  "{securityAnalysis}"
                </p>
              </div>
            ) : (
              <p style={{ fontSize: "0.75rem", color: "var(--text-3)", margin: 0 }}>
                {dayReadings.length === 0 
                  ? "Tidak ada data sensor untuk dianalisis." 
                  : "Klik tombol di atas untuk menganalisis log keamanan hari ini."}
              </p>
            )}
          </div>

          {selectedDate === today ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5" style={{ background: "var(--surface-2)" }}>
                  <p className="sh-label mb-2" style={{ fontSize: "0.6rem" }}>Pengunjung Live</p>
                  <div className="sh-value" style={{ fontSize: "2.2rem", color: "#E8714A" }}>
                    {sensorData?.orang_hari_ini ?? "—"}
                    <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--text-2)", marginLeft: "0.3rem" }}>orang</span>
                  </div>
                </div>
                <div className="rounded-2xl p-5" style={{ background: "var(--surface-2)" }}>
                  <p className="sh-label mb-2" style={{ fontSize: "0.6rem" }}>Total Tercatat</p>
                  <div className="sh-value" style={{ fontSize: "2.2rem", color: "#5BAD7F" }}>
                    {selectedEntry?.total ?? "—"}
                    <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--text-2)", marginLeft: "0.3rem" }}>orang</span>
                  </div>
                </div>
              </div>
              <TemperatureChart sensorData={sensorData} />
              <ReadingsTable readings={dayReadings} loading={dayLoading} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl p-5" style={{ background: "var(--surface-2)" }}>
                <p className="sh-label mb-2" style={{ fontSize: "0.6rem" }}>Total Pengunjung</p>
                <div className="sh-value" style={{ fontSize: "2.2rem", color: "#5BAD7F" }}>
                  {selectedEntry?.total ?? "—"}
                  <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--text-2)", marginLeft: "0.3rem" }}>orang</span>
                </div>
              </div>
              <ReadingsTable readings={dayReadings} loading={dayLoading} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function ReadingsTable({ readings, loading }: { readings: SensorReading[]; loading: boolean }) {
  if (loading) {
    return (
      <p className="sh-label text-center" style={{ fontSize: "0.65rem", padding: "1.5rem 0" }}>
        memuat data…
      </p>
    );
  }

  if (readings.length === 0) {
    return (
      <p className="sh-label" style={{ fontSize: "0.65rem" }}>
        Belum ada data sensor tercatat untuk hari ini
      </p>
    );
  }

  return (
    <div style={{ overflow: "hidden", borderRadius: "16px", border: "1px solid var(--border)" }}>
      <p className="sh-label" style={{ fontSize: "0.6rem", padding: "0.75rem 1rem 0.5rem" }}>
        Rekap Per Waktu ({readings.length} data)
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
              {["Waktu", "Pengunjung", "Suhu (°C)", "Kelembapan (%)"].map((h) => (
                <th
                  key={h}
                  className="sh-label text-left"
                  style={{ padding: "0.6rem 1rem", fontSize: "0.58rem" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => (
              <tr
                key={r.waktu}
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <td style={{ padding: "0.6rem 1rem", fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--text-2)" }}>
                  {r.waktu}
                </td>
                <td style={{ padding: "0.6rem 1rem", fontFamily: "var(--font-body)", fontSize: "0.85rem", fontWeight: 600, color: "#5BAD7F" }}>
                  {r.orang_hari_ini}
                </td>
                <td style={{ padding: "0.6rem 1rem", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#E8714A" }}>
                  {r.suhu}°
                </td>
                <td style={{ padding: "0.6rem 1rem", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--text)" }}>
                  {r.kelembapan}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
