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
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    min: round1(Math.min(...values)),
    max: round1(Math.max(...values)),
    avg: round1(values.reduce((a, b) => a + b, 0) / values.length),
  };
}

function nowLabel() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const statsCfg = [
  { key: "min" as const, label: "Min",  color: "#4A8FE7" },
  { key: "avg" as const, label: "Rata",  color: "#9B9691" },
  { key: "max" as const, label: "Maks",  color: "#E8714A" },
];

export function TemperatureChart({ sensorData }: TemperatureChartProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const chartRef   = useRef<Chart | null>(null);
  const labelsRef  = useRef<string[]>([]);
  const valuesRef  = useRef<number[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

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
            borderColor: "#4A8FE7",
            backgroundColor: (ctx) => {
              const chart = ctx.chart;
              const { ctx: c, chartArea } = chart;
              if (!chartArea) return "rgba(74,143,231,0.08)";
              const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, "rgba(74,143,231,0.15)");
              gradient.addColorStop(1, "rgba(74,143,231,0)");
              return gradient;
            },
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#4A8FE7",
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            ticks: {
              color: "#C8C4BE",
              font: { family: "DM Sans", size: 10 },
              maxTicksLimit: 6,
              maxRotation: 0,
            },
            grid: { display: false },
            border: { display: false },
          },
          y: {
            min: 15,
            max: 40,
            ticks: {
              color: "#C8C4BE",
              font: { family: "DM Sans", size: 10 },
              callback: (v) => `${v}°`,
              stepSize: 5,
            },
            grid: { color: "rgba(0,0,0,0.04)" },
            border: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#FFFFFF",
            borderColor: "rgba(0,0,0,0.1)",
            borderWidth: 1,
            titleColor: "#9B9691",
            bodyColor: "#1C1B19",
            titleFont: { family: "DM Sans", size: 10 },
            bodyFont: { family: "DM Sans", size: 13, weight: 600 },
            padding: 10,
            callbacks: {
              label: (item) => ` ${item.raw}°C`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

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
    <div className="sh-card p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="sh-label mb-1">Sensor Suhu</p>
          <h2
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            Grafik Realtime
          </h2>
        </div>

        {sensorData && (
          <div style={{ textAlign: "right" }}>
            <div
              className="sh-value"
              style={{ fontSize: "2rem", color: "#4A8FE7" }}
            >
              {sensorData.suhu}
              <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--text-2)", marginLeft: "3px" }}>°C</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height: "190px" }}>
        <canvas ref={canvasRef} />
      </div>

      {/* Stats */}
      {stats ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {statsCfg.map(({ key, label, color }) => (
            <div
              key={key}
              className="text-center py-3 px-2 rounded-2xl"
              style={{ background: "var(--surface-2)" }}
            >
              <div
                className="sh-value tabular-nums"
                style={{ fontSize: "1.05rem", color }}
              >
                {stats[key]}°
              </div>
              <div className="sh-label mt-1" style={{ fontSize: "0.6rem" }}>{label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 py-2 text-center sh-label" style={{ fontSize: "0.65rem" }}>
          menunggu data…
        </div>
      )}
    </div>
  );
}
