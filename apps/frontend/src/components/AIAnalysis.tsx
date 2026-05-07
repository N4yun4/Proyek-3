import { useState, useEffect } from "react";
import clsx from "clsx";
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

  // Auto-load once when first sensor data arrives
  useEffect(() => {
    if (sensorData && !hasAutoLoaded) {
      setHasAutoLoaded(true);
      const timer = setTimeout(fetchAnalysis, 2000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorData, hasAutoLoaded]);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
          🤖 Analisis AI
        </h2>
        <button
          onClick={fetchAnalysis}
          disabled={loading || !sensorData}
          className={clsx(
            "px-3 py-1 text-xs rounded-lg transition-colors duration-150",
            loading || !sensorData
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          )}
        >
          {loading ? "Menganalisis..." : "Refresh"}
        </button>
      </div>

      <div className="min-h-24">
        {loading && (
          <div className="flex items-center gap-2 text-purple-400 text-sm">
            <span className="animate-spin">⏳</span> Menganalisis kondisi ruangan...
          </div>
        )}
        {!loading && error && (
          <div className="text-red-400 text-sm">
            {error}
            <button
              onClick={fetchAnalysis}
              className="ml-2 underline text-red-300 hover:text-red-200"
            >
              Coba lagi
            </button>
          </div>
        )}
        {!loading && !error && analysis && (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{analysis}</p>
        )}
        {!loading && !error && !analysis && (
          <p className="text-sm text-gray-400">
            Klik Refresh untuk mendapatkan analisis kondisi ruangan.
          </p>
        )}
      </div>
    </div>
  );
}
