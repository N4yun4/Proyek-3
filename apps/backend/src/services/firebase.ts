import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, get, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(firebaseApp);

export interface SensorRealtimeData {
  suhu: number;
  kelembapan: number;
  orang_hari_ini: number;
  tanggal: string;
}

export interface HistoryEntry {
  tanggal: string;
  total: number;
}

export interface DailyTemperature {
  suhu: number;
  kelembapan: number;
}

export interface SensorReading {
  waktu: string;       // "HH:mm:ss"
  suhu: number;
  kelembapan: number;
  orang_hari_ini: number;
}

export async function getRealtimeSensor(): Promise<SensorRealtimeData> {
  const snapshot = await get(ref(db, "/sensor/realtime"));
  if (!snapshot.exists()) throw new Error("No realtime data");
  return snapshot.val() as SensorRealtimeData;
}

export async function getHistory(from?: string, to?: string): Promise<HistoryEntry[]> {
  const snapshot = await get(ref(db, "/sensor/orang_harian"));
  if (!snapshot.exists()) return [];

  const raw = snapshot.val() as Record<string, number>;
  const entries: HistoryEntry[] = Object.entries(raw).map(([tanggal, total]) => ({
    tanggal,
    total,
  }));

  return entries
    .filter((e) => {
      if (from && e.tanggal < from) return false;
      if (to && e.tanggal > to) return false;
      return true;
    })
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

export async function getTemperatureHistory(): Promise<Record<string, DailyTemperature>> {
  try {
    const snapshot = await get(ref(db, "/sensor/suhu_harian"));
    if (!snapshot.exists()) return {};
    return snapshot.val() as Record<string, DailyTemperature>;
  } catch {
    return {};
  }
}

// Ambil semua pembacaan sensor untuk 1 hari tertentu
export async function getDayReadings(date: string): Promise<SensorReading[]> {
  try {
    const snapshot = await get(ref(db, `/sensor/readings/${date}`));
    if (!snapshot.exists()) return [];
    const raw = snapshot.val() as Record<string, Omit<SensorReading, "waktu">>;
    return Object.entries(raw)
      .map(([waktu, data]) => ({ waktu, ...data }))
      .sort((a, b) => a.waktu.localeCompare(b.waktu));
  } catch {
    return [];
  }
}

// Throttle: simpan maksimal 1 kali per menit per tanggal
const lastRecordedAt: Record<string, number> = {};

async function recordSensorReading(data: SensorRealtimeData) {
  const now = Date.now();
  if (lastRecordedAt[data.tanggal] && now - lastRecordedAt[data.tanggal] < 60_000) return;
  lastRecordedAt[data.tanggal] = now;

  const waktu = new Date().toTimeString().slice(0, 8); // "HH:mm:ss"
  try {
    await Promise.all([
      // Simpan pembacaan lengkap per menit
      set(ref(db, `/sensor/readings/${data.tanggal}/${waktu}`), {
        suhu: data.suhu,
        kelembapan: data.kelembapan,
        orang_hari_ini: data.orang_hari_ini,
      }),
      // Simpan ringkasan suhu harian (overwrite dengan nilai terbaru)
      set(ref(db, `/sensor/suhu_harian/${data.tanggal}`), {
        suhu: data.suhu,
        kelembapan: data.kelembapan,
      }),
    ]);
  } catch {
    // Firebase rules mungkin belum mengizinkan write
  }
}

export function subscribeToRealtime(
  callback: (data: SensorRealtimeData) => void
): () => void {
  const unsubscribe = onValue(ref(db, "/sensor/realtime"), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val() as SensorRealtimeData;
      callback(data);
      void recordSensorReading(data);
    }
  });
  return unsubscribe;
}
