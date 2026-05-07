import type { HistoryFilter } from "../types/sensor";

export function filterToDates(filter: HistoryFilter): { from?: string; to?: string } {
  if (filter === "all") return {};
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const from = new Date(today);
  from.setDate(from.getDate() - (filter === "7d" ? 7 : 30));
  return { from: from.toISOString().slice(0, 10), to };
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}
