import { Elysia, t } from "elysia";
import { chatAI } from "../services/openrouter";

const chatRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkChatRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = chatRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    chatRateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export const chatRoutes = new Elysia({ prefix: "/api/ai" }).post(
  "/chat",
  async ({ body, set, request }) => {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkChatRateLimit(ip)) {
      set.status = 429;
      return { error: "Terlalu banyak request, coba lagi dalam 1 menit" };
    }

    const { messages, sensorContext } = body;

    const sensorInfo = sensorContext
      ? `\nData sensor saat ini: suhu ${sensorContext.suhu}°C, kelembapan ${sensorContext.kelembapan}%, pengunjung hari ini ${sensorContext.orang_hari_ini} orang.`
      : "";

    const systemPrompt =
      `Kamu adalah asisten pintar untuk sistem monitoring ruangan IoT di Samarinda, Kalimantan Timur. ` +
      `Konteks iklim lokal: suhu udara luar Samarinda rata-rata 28–35°C sepanjang tahun, ` +
      `suhu ruangan yang nyaman berkisar 24–30°C, kelembapan normal 65–85%. ` +
      `Gunakan acuan ini saat menilai apakah kondisi ruangan normal, panas, atau memerlukan tindakan. ` +
      `Jawab pertanyaan tentang kondisi ruangan secara ringkas dan ramah dalam bahasa Indonesia.` +
      sensorInfo;

    try {
      const reply = await chatAI(messages, systemPrompt);
      return { reply };
    } catch {
      set.status = 500;
      return { error: "Chat AI gagal, coba lagi nanti" };
    }
  },
  {
    body: t.Object({
      messages: t.Array(
        t.Object({
          role: t.Union([t.Literal("user"), t.Literal("assistant")]),
          content: t.String(),
        })
      ),
      sensorContext: t.Optional(
        t.Object({
          suhu: t.Number(),
          kelembapan: t.Number(),
          orang_hari_ini: t.Number(),
        })
      ),
    }),
  }
);
