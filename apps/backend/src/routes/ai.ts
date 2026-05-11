import { Elysia, t } from "elysia";
import { analyzeRoom, analyzeSecurityLog } from "../services/openrouter";

// Simple in-memory rate limiter: 10 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 10) return false;

  entry.count++;
  return true;
}

export const aiRoutes = new Elysia({ prefix: "/api/ai" }).post(
  "/analyze",
  async ({ body, set, request }) => {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";

    if (!checkRateLimit(ip)) {
      set.status = 429;
      return { error: "Terlalu banyak request, coba lagi dalam 1 menit" };
    }

    try {
      const analysis = await analyzeRoom(body);
      return { analysis };
    } catch (err) {
      set.status = 500;
      return { error: "Analisis AI gagal, coba lagi nanti" };
    }
  },
  {
    body: t.Object({
      suhu: t.Number(),
      kelembapan: t.Number(),
      orang_hari_ini: t.Number(),
    }),
  }
)
.post(
  "/analyze-security",
  async ({ body, set, request }) => {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";

    if (!checkRateLimit(ip)) {
      set.status = 429;
      return { error: "Terlalu banyak request, coba lagi dalam 1 menit" };
    }

    try {
      const analysis = await analyzeSecurityLog(body.date, body.readings);
      return { analysis };
    } catch (err) {
      set.status = 500;
      return { error: "Analisis keamanan AI gagal, coba lagi nanti" };
    }
  },
  {
    body: t.Object({
      date: t.String(),
      readings: t.Array(
        t.Object({
          waktu: t.String(),
          orang_hari_ini: t.Number(),
          suhu: t.Number(),
          kelembapan: t.Number(),
        })
      ),
    }),
  }
);
