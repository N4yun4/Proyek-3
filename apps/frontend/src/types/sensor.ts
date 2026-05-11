export interface SensorData {
  suhu: number;
  kelembapan: number;
  orang_hari_ini: number;
  tanggal: string;
}

export interface HistoryEntry {
  tanggal: string;
  total: number;
}

export interface SensorReading {
  waktu: string;
  suhu: number;
  kelembapan: number;
  orang_hari_ini: number;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected";
export type Theme = "dark" | "light";
export type HistoryFilter = "7d" | "30d" | "all";
