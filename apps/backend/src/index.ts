import "./loadEnv"; // HARUS paling pertama — set process.env sebelum Firebase init
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
console.log("Env check:", {
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? "✓" : "✗ MISSING",
  FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL ? "✓" : "✗ MISSING",
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY ? "✓" : "✗ MISSING",
});

console.log("Registered routes:");
app.routes.forEach(r => console.log(r.method, r.path));

console.log("Backend fully loaded and watching for changes!");
