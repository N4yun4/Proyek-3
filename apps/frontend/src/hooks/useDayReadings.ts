import { useState, useEffect } from "react";
import { fetchDayReadings } from "../api/sensor";
import type { SensorReading } from "../types/sensor";

export function useDayReadings(date: string | null) {
  const [data, setData] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) {
      setData([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchDayReadings(date)
      .then((readings) => {
        if (!cancelled) setData(readings);
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
  }, [date]);

  return { data, loading, error };
}
