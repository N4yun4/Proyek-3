import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    })
  )
  .get("/health", () => ({ status: "ok" }))
  .listen(Number(process.env.PORT ?? 3000));

console.log(`Backend running at http://localhost:${app.server?.port}`);
