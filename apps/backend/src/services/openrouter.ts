export interface AnalyzeInput {
  suhu: number;
  kelembapan: number;
  orang_hari_ini: number;
}

export async function analyzeRoom(input: AnalyzeInput): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "inclusionai/ling-2.6-1t:free",
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah asisten analisis kondisi ruangan IoT. Berikan analisis singkat (3-4 kalimat) dalam bahasa Indonesia yang mencakup: anomali suhu, kepadatan ruangan, dan rekomendasi kondisi ruangan.",
        },
        {
          role: "user",
          content: `Data sensor saat ini:\n- Suhu: ${input.suhu}°C\n- Kelembapan: ${input.kelembapan}%\n- Jumlah orang hari ini: ${input.orang_hari_ini} orang`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.choices[0].message.content as string;
}
