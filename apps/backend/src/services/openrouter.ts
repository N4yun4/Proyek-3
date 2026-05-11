export interface AnalyzeInput {
  suhu: number;
  kelembapan: number;
  orang_hari_ini: number;
}

export async function analyzeRoom(input: AnalyzeInput): Promise<string> {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: process.env.NVIDIA_MODEL ?? "nvidia/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah asisten analisis kondisi ruangan IoT di Samarinda, Kalimantan Timur. " +
            "Konteks iklim lokal: suhu normal ruangan di Samarinda berkisar 27–33°C, kelembapan normal 65–85%. " +
            "Suhu di bawah 25°C dianggap sejuk/ber-AC, 34–36°C sudah panas berlebih, di atas 36°C kritis. " +
            "Kelembapan di atas 85% berpotensi menimbulkan jamur dan ketidaknyamanan. " +
            "Berikan analisis singkat (3-4 kalimat) dalam bahasa Indonesia yang mencakup: kondisi suhu relatif terhadap iklim Samarinda, kondisi kelembapan, kepadatan ruangan, dan rekomendasi praktis.",
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
    throw new Error(`NVIDIA error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.choices[0].message.content as string;
}

export interface SecurityReading {
  waktu: string;
  orang_hari_ini: number;
  suhu: number;
  kelembapan: number;
}

export async function analyzeSecurityLog(date: string, readings: SecurityReading[]): Promise<string> {
  const readingsText = readings
    .map((r) => `- ${r.waktu}: ${r.orang_hari_ini} orang, ${r.suhu}°C, ${r.kelembapan}%`)
    .join("\n");

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: process.env.NVIDIA_MODEL ?? "nvidia/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "Kamu adalah asisten ahli keamanan dan privasi ruangan di Samarinda, Kalimantan Timur. " +
            "Konteks iklim lokal: suhu normal ruangan 27–33°C, kelembapan normal 65–85%. " +
            "Tugasmu adalah menganalisis log aktivitas sensor untuk mendeteksi kemungkinan adanya penyusupan atau akses tidak sah. " +
            "Gunakan nada bicara yang waspada namun profesional. Jika ada aktivitas masuk di jam yang tidak biasa atau lonjakan suhu/orang yang mencurigakan, berikan peringatan. " +
            "Berikan analisis dalam 3-4 kalimat singkat dalam bahasa Indonesia.",
        },
        {
          role: "user",
          content: `Log aktivitas sensor untuk tanggal ${date}:\n${readingsText}\n\nBerikan analisis keamanan singkat untuk hari ini.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NVIDIA error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.choices[0].message.content as string;
}

export async function chatAI(messages: { role: string; content: string }[], systemPrompt: string): Promise<string> {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: process.env.NVIDIA_MODEL ?? "nvidia/gpt-oss-20b",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NVIDIA error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.choices[0].message.content as string;
}
