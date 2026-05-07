import { useEffect, useRef, useState } from "react";
import {
  Chart,
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
} from "chart.js";
import clsx from "clsx";
import type { SensorData } from "../types/sensor";

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler);

const MAX_POINTS = 60;

interface TemperatureChartProps {
  sensorData: SensorData | null;
}

interface Stats {
  min: number;
  max: number;
  avg: number;
}

function calcStats(values: number[]): Stats | null {
  if (values.length === 0) return null;
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
  };
}

function nowLabel() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function TemperatureChart({ sensorData }: TemperatureChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const labelsRef = useRef<string[]>([]);
  const valuesRef = useRef<number[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  // Init chart
  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Suhu (°C)",
            data: [],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            ticks: { color: "#6b7280", maxTicksLimit: 8 },
            grid: { color: "rgba(107,114,128,0.1)" },
          },
          y: {
            min: 15,
            max: 40,
            ticks: { color: "#6b7280" },
            grid: { color: "rgba(107,114,128,0.1)" },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: { mode: "index", intersect: false },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  // Push new data points
  useEffect(() => {
    if (!sensorData || !chartRef.current) return;

    labelsRef.current.push(nowLabel());
    valuesRef.current.push(sensorData.suhu);

    if (labelsRef.current.length > MAX_POINTS) {
      labelsRef.current.shift();
      valuesRef.current.shift();
    }

    chartRef.current.data.labels = [...labelsRef.current];
    chartRef.current.data.datasets[0].data = [...valuesRef.current];
    chartRef.current.update("none");

    setStats(calcStats(valuesRef.current));
  }, [sensorData]);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Grafik Suhu — Sesi Aktif
      </h2>
      <div className="h-56">
        <canvas ref={canvasRef} />
      </div>
      {stats && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
          {[
            { label: "Min", value: `${stats.min}°C`, color: "text-blue-400" },
            { label: "Avg", value: `${stats.avg}°C`, color: "text-gray-400" },
            { label: "Max", value: `${stats.max}°C`, color: "text-red-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg bg-gray-50 dark:bg-gray-800 py-2">
              <div className={clsx("font-bold tabular-nums", color)}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
