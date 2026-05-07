import type { SensorData, HistoryEntry } from "../types/sensor";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function fetchRealtime(): Promise<SensorData> {
  const res = await fetch(`${BASE}/api/sensor/realtime`);
  if (!res.ok) throw new Error("Gagal mengambil data sensor");
  return res.json() as Promise<SensorData>;
}

export async function fetchHistory(from?: string, to?: string): Promise<HistoryEntry[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await fetch(`${BASE}/api/sensor/history?${params.toString()}`);
  if (!res.ok) throw new Error("Gagal mengambil riwayat");
  return res.json() as Promise<HistoryEntry[]>;
}
