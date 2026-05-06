import { Elysia, t } from "elysia";
import {
  getRealtimeSensor,
  getHistory,
  subscribeToRealtime,
  type SensorRealtimeData,
} from "../services/firebase";

// Set of active WebSocket clients
const wsClients = new Set<{ send: (msg: string) => void }>();

// Subscribe to Firebase once at startup — broadcast to all WS clients
subscribeToRealtime((data: SensorRealtimeData) => {
  const message = JSON.stringify({ type: "sensor_update", data });
  wsClients.forEach((ws) => {
    try {
      ws.send(message);
    } catch {
      // client disconnected mid-send, will be cleaned up on close
    }
  });
});

export const sensorRoutes = new Elysia({ prefix: "/api/sensor" })
  .get(
    "/realtime",
    async ({ set }) => {
      try {
        return await getRealtimeSensor();
      } catch {
        set.status = 503;
        return { error: "Database tidak bisa diakses" };
      }
    }
  )
  .get(
    "/history",
    async ({ query, set }) => {
      try {
        return await getHistory(query.from, query.to);
      } catch {
        set.status = 503;
        return { error: "Database tidak bisa diakses" };
      }
    },
    {
      query: t.Object({
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
      }),
    }
  )
  .ws("/live", {
    open(ws) {
      wsClients.add(ws);
    },
    close(ws) {
      wsClients.delete(ws);
    },
    message() {
      // client messages ignored — server-push only
    },
  });
