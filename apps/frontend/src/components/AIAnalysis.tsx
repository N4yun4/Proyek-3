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
    <div className="orb-card orb-card-purple p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="orb-label mb-0.5">Kecerdasan Buatan</p>
          <h2
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#c4b5fd",
              letterSpacing: "0.04em",
            }}
          >
            ANALISIS AI
          </h2>
        </div>

        <button
          onClick={fetchAnalysis}
          disabled={!canRefresh}
          className={`orb-btn ${canRefresh ? "orb-btn-primary" : "orb-btn-disabled"}`}
          style={{
            fontSize: "0.65rem",
            padding: "0.3rem 0.75rem",
            borderRadius: "8px",
            ...(canRefresh
              ? {
                  background: "linear-gradient(135deg, rgba(167,139,250,0.18), rgba(196,181,253,0.1))",
                  borderColor: "rgba(167,139,250,0.4)",
                  color: "#c4b5fd",
                }
              : {}),
          }}
        >
          {loading ? "ANALISIS…" : "REFRESH"}
        </button>
      </div>

      <div className="orb-divider mb-3" />

      {/* Content */}
      <div style={{ minHeight: "80px" }}>
        {loading && (
          <div
            className="ai-loading rounded-lg p-3"
            style={{ fontSize: "0.75rem", fontFamily: "var(--font-body)", color: "rgba(150,180,220,0.6)", lineHeight: 1.6 }}
          >
            Menganalisis kondisi ruangan…
          </div>
        )}

        {!loading && error && (
          <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-body)", color: "var(--red)", lineHeight: 1.6 }}>
            {error}{" "}
            <button
              onClick={fetchAnalysis}
              style={{
                color: "#fca5a5",
                textDecoration: "underline",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "0.75rem",
              }}
            >
              Coba lagi
            </button>
          </div>
        )}

        {!loading && !error && analysis && (
          <p
            style={{
              fontSize: "0.78rem",
              fontFamily: "var(--font-body)",
              color: "var(--text)",
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            {analysis}
          </p>
        )}

        {!loading && !error && !analysis && (
          <p className="orb-label text-center py-4" style={{ fontSize: "0.65rem" }}>
            menunggu analisis…
          </p>
        )}
      </div>
    </div>
  );
}
