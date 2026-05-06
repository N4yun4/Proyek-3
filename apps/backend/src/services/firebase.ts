import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, get, onValue } from "firebase/database";

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

export function subscribeToRealtime(
  callback: (data: SensorRealtimeData) => void
): () => void {
  const unsubscribe = onValue(ref(db, "/sensor/realtime"), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as SensorRealtimeData);
    }
  });
  return unsubscribe;
}
