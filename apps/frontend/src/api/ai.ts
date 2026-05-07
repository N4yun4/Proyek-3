import type { SensorData } from "../types/sensor";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function analyzeRoom(
  data: Pick<SensorData, "suhu" | "kelembapan" | "orang_hari_ini">
): Promise<string> {
  const res = await fetch(`${BASE}/api/ai/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res.status === 429) throw new Error("Terlalu banyak request, coba lagi nanti");
  if (!res.ok) throw new Error("Analisis AI gagal");

  const json = (await res.json()) as { analysis: string };
  return json.analysis;
}
