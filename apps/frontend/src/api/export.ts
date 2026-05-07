const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function downloadCSV(from?: string, to?: string): Promise<"empty" | "ok"> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const res = await fetch(`${BASE}/api/sensor/export?${params.toString()}`);

  if (res.status === 204) return "empty";
  if (!res.ok) throw new Error("Export gagal");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `monitoring-${from ?? "all"}-${to ?? "all"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return "ok";
}
