import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { sensorRoutes } from "./routes/sensor";
import { exportRoutes } from "./routes/export";
import { aiRoutes } from "./routes/ai";
import { chatRoutes } from "./routes/chat";

const app = new Elysia()
  .use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173" }))
  .use(sensorRoutes)
  .use(exportRoutes)
  .use(aiRoutes)
  .use(chatRoutes)
  .get("/health", () => ({ status: "ok" }))
  .listen(Number(process.env.PORT ?? 3000));

console.log(`Backend running at http://localhost:${app.server?.port}`);
