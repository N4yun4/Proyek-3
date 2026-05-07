import { useState, useEffect } from "react";
import { fetchHistory } from "../api/sensor";
import type { HistoryEntry, HistoryFilter } from "../types/sensor";

function getDateRange(filter: HistoryFilter): { from?: string; to?: string } {
  if (filter === "all") return {};

  const today = new Date();
  const to = today.toISOString().slice(0, 10);

  const days = filter === "7d" ? 7 : 30;
  const from = new Date(today);
  from.setDate(from.getDate() - days);

  return { from: from.toISOString().slice(0, 10), to };
}

export function useHistory(filter: HistoryFilter) {
  const [data, setData] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const { from, to } = getDateRange(filter);

    fetchHistory(from, to)
      .then((entries) => {
        if (!cancelled) setData(entries);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filter]);

  return { data, loading, error };
}
