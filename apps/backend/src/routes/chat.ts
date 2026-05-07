import { Elysia, t } from "elysia";

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
      `Kamu adalah asisten pintar untuk sistem monitoring ruangan IoT. ` +
      `Jawab pertanyaan tentang kondisi ruangan secara ringkas dan ramah dalam bahasa Indonesia.` +
      sensorInfo;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "inclusionai/ling-2.6-1t:free",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenRouter error ${res.status}: ${text}`);
      }

      const json = await res.json() as { choices: { message: { content: string } }[] };
      return { reply: json.choices[0].message.content };
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
