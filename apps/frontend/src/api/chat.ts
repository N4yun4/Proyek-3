export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  sensorContext?: { suhu: number; kelembapan: number; orang_hari_ini: number };
}

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function sendChatMessage(req: ChatRequest): Promise<string> {
  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (res.status === 429) {
    throw new Error("Terlalu banyak permintaan, tunggu sebentar.");
  }
  if (!res.ok) {
    throw new Error("Chat AI gagal, coba lagi nanti.");
  }

  const data = await res.json() as { reply: string };
  return data.reply;
}
