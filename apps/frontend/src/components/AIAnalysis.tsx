import { useState, useEffect } from "react";
import { analyzeRoom } from "../api/ai";
import type { SensorData } from "../types/sensor";

interface AIAnalysisProps {
  sensorData: SensorData | null;
}

export function AIAnalysis({ sensorData }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);

  async function fetchAnalysis() {
    if (!sensorData) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeRoom({
        suhu: sensorData.suhu,
        kelembapan: sensorData.kelembapan,
        orang_hari_ini: sensorData.orang_hari_ini,
      });
      setAnalysis(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analisis gagal");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sensorData && !hasAutoLoaded) {
      setHasAutoLoaded(true);
      const timer = setTimeout(fetchAnalysis, 2000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorData, hasAutoLoaded]);

  const canRefresh = !loading && !!sensorData;

  return (
    <div className="sh-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {/* AI icon */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(232,113,74,0.1)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5C4 1.5 2 3.5 2 6c0 1.2.4 2.2 1.1 3L2.5 12l2.8-1C5.9 11.3 6.4 11.5 7 11.5c3 0 5-2 5-4.5S10 1.5 7 1.5z" stroke="#E8714A" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M5 6h4M5 8h2" stroke="#E8714A" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="sh-label mb-0" style={{ fontSize: "0.6rem" }}>Kecerdasan Buatan</p>
            <h3
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              Analisis AI
            </h3>
          </div>
        </div>

        <button
          onClick={fetchAnalysis}
          disabled={!canRefresh}
          className={`sh-btn ${canRefresh ? "sh-btn-ghost" : "sh-btn-disabled"}`}
          style={{
            fontSize: "0.68rem",
            padding: "0.28rem 0.7rem",
            letterSpacing: "0.02em",
          }}
        >
          {loading ? "Analisis…" : "Refresh"}
        </button>
      </div>

      <div className="sh-divider mb-3" />

      {/* Content */}
      <div style={{ minHeight: "72px" }}>
        {loading && (
          <div className="space-y-2">
            <div className="sh-loading h-3 rounded" style={{ width: "92%" }} />
            <div className="sh-loading h-3 rounded" style={{ width: "78%" }} />
            <div className="sh-loading h-3 rounded" style={{ width: "85%" }} />
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              fontSize: "0.78rem",
              fontFamily: "var(--font-body)",
              color: "var(--red)",
              lineHeight: 1.6,
            }}
          >
            {error}{" "}
            <button
              onClick={fetchAnalysis}
              style={{
                color: "var(--accent)",
                textDecoration: "underline",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "0.78rem",
              }}
            >
              Coba lagi
            </button>
          </div>
        )}

        {!loading && !error && analysis && (
          <p
            style={{
              fontSize: "0.82rem",
              fontFamily: "var(--font-body)",
              color: "var(--text)",
              lineHeight: 1.75,
              margin: 0,
              fontWeight: 400,
            }}
          >
            {analysis}
          </p>
        )}

        {!loading && !error && !analysis && (
          <p className="sh-label" style={{ fontSize: "0.65rem", paddingTop: "1rem" }}>
            Klik Refresh untuk menganalisis kondisi ruangan.
          </p>
        )}
      </div>
    </div>
  );
}
