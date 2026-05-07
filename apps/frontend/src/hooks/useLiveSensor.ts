import { useState, useEffect, useRef } from "react";
import type { SensorData, ConnectionStatus } from "../types/sensor";

const WS_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000")
  .replace(/^http/, "ws") + "/api/sensor/live";

export function useLiveSensor() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function connect() {
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus("connecting");

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setStatus("connected");

      ws.onmessage = (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data as string) as {
            type: string;
            data: SensorData;
          };
          if (msg.type === "sensor_update") setSensorData(msg.data);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        timerRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      wsRef.current?.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { sensorData, status };
}
