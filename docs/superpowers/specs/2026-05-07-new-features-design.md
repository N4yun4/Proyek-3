# New Features: Bug Fix, AI Chat, Rekap Harian

## Goal

Fix data tidak muncul di frontend, tambahkan halaman AI Chat multi-turn, dan halaman Rekap Harian dengan detail per hari dan export CSV.

## Architecture

Monorepo Bun Workspace. Backend Elysia.js di `apps/backend`, frontend Vite+React+TS+Tailwind di `apps/frontend`. Tema HEARTH (minimalist smart home).

---

## 1. Bug Fixes

### 1a. WebSocket URL Salah Path
**File:** `apps/frontend/src/hooks/useLiveSensor.ts`

Baris 4 saat ini:
```typescript
const WS_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000")
  .replace(/^http/, "ws") + "/sensor/live";
```
Harus diubah ke:
```typescript
const WS_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000")
  .replace(/^http/, "ws") + "/api/sensor/live";
```
Backend mendaftarkan WebSocket di prefix `/api/sensor` + path `/live` = `/api/sensor/live`.

### 1b. Backend Tidak Menemukan `.env`
**File baru:** `apps/backend/.env`

Buat file ini dengan isi credentials dari root `.env`. Bun mencari `.env` dari working directory saat runtime (`apps/backend/`), bukan dari root monorepo.

```
FIREBASE_API_KEY=<dari root .env>
FIREBASE_DATABASE_URL=<dari root .env>
OPENROUTER_API_KEY=<dari root .env>
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
```

---

## 2. Navigasi (React Router DOM v6)

### Dependencies
Tambahkan ke `apps/frontend/package.json`:
```json
"react-router-dom": "^6.26.0"
```

### File Structure Baru
```
apps/frontend/src/
  main.tsx          (tambah RouterProvider)
  App.tsx           (ganti dengan route config)
  components/
    Layout.tsx      (baru: shared nav + header wrapper)
  pages/
    Dashboard.tsx   (existing, tidak berubah)
    ChatPage.tsx    (baru)
    RekapPage.tsx   (baru)
```

### Layout.tsx
Komponen wrapper untuk semua halaman. Berisi:
- Header yang sudah ada (judul "Home Monitor" + ThemeToggle + status koneksi)
- Nav bar di bawah header dengan 3 `NavLink`:
  - `/` → "Dashboard"
  - `/chat` → "AI Chat"  
  - `/rekap` → "Rekap Harian"
- Link aktif: background `var(--accent)`, teks putih. Inactive: teks `var(--text-2)`.
- `<Outlet />` merender halaman aktif

`useLiveSensor` dan `useTheme` dipindahkan ke `Layout.tsx` agar bisa di-share ke semua halaman via React Context atau props drilling. Sensor data diteruskan ke `Dashboard` via Context.

### SensorContext
Buat `apps/frontend/src/context/SensorContext.tsx`:
```typescript
interface SensorContextValue {
  sensorData: SensorData | null;
  status: ConnectionStatus;
}
export const SensorContext = createContext<SensorContextValue>({...});
```
`Layout.tsx` memanggil `useLiveSensor()` dan menyediakan context ini. Semua halaman konsumsi via `useSensor()` hook.

### App.tsx (baru)
```typescript
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ChatPage } from "./pages/ChatPage";
import { RekapPage } from "./pages/RekapPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "chat", element: <ChatPage /> },
      { path: "rekap", element: <RekapPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

---

## 3. AI Chat Page (`/chat`)

### Backend — `apps/backend/src/routes/chat.ts`

Endpoint baru: `POST /api/ai/chat`

Request body:
```typescript
interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  sensorContext?: { suhu: number; kelembapan: number; orang_hari_ini: number };
}
```

Response:
```typescript
interface ChatResponse {
  reply: string;
}
```

Logic:
1. Rate limit sama seperti `/api/ai/analyze` (10 req/min per IP via `rateLimitMap`)
2. Build system prompt:
   ```
   Kamu adalah asisten pintar untuk sistem monitoring ruangan IoT.
   Jawab pertanyaan tentang kondisi ruangan secara ringkas dan ramah.
   [jika sensorContext ada] Data sensor saat ini: suhu {suhu}°C, kelembapan {kelembapan}%, pengunjung hari ini {orang_hari_ini} orang.
   ```
3. Kirim ke OpenRouter: `[{ role: "system", content: systemPrompt }, ...messages]`
4. Return `{ reply: content }` atau 429/500

Register di `apps/backend/src/index.ts`:
```typescript
import { chatRoutes } from "./routes/chat";
app.use(chatRoutes);
```

### Frontend API — `apps/frontend/src/api/chat.ts`

```typescript
interface ChatMessage { role: "user" | "assistant"; content: string; }
interface ChatRequest {
  messages: ChatMessage[];
  sensorContext?: { suhu: number; kelembapan: number; orang_hari_ini: number };
}
export async function sendChatMessage(req: ChatRequest): Promise<string>
```

Error khusus 429: lempar `Error("Terlalu banyak permintaan, tunggu sebentar.")`

### Frontend — `apps/frontend/src/pages/ChatPage.tsx`

State:
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [input, setInput] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

Konsumsi `SensorContext` untuk mendapatkan `sensorData`.

UI:
- Header kartu: judul "AI Chat", tombol "Percakapan Baru" (ghost button, kanan atas)
- Area chat (scrollable, `flex-col`, auto-scroll ke bawah saat pesan baru)
- Bubble user: kanan, background `var(--accent)` (terracotta), teks putih, radius 18px 18px 4px 18px
- Bubble AI: kiri, background `var(--surface-2)`, teks `var(--text)`, radius 18px 18px 18px 4px
- Pesan selamat datang default saat `messages.length === 0`: "Halo! Saya siap membantu menganalisis kondisi ruangan. Tanyakan apa saja."
- Loading indicator: 3 titik animasi bergerak (bounce) di posisi bubble AI
- Error: teks merah inline di bawah area chat, ada tombol "Coba lagi"
- Input area (sticky bottom): textarea satu baris + tombol Kirim (disabled saat loading atau input kosong)
- Kirim via Enter (tanpa Shift), Shift+Enter untuk newline
- Setiap kali kirim: append user message → call API (kirim semua history + sensorContext) → append AI reply

---

## 4. Rekap Harian Page (`/rekap`)

### Tidak ada endpoint baru

Menggunakan endpoint yang sudah ada:
- `GET /api/sensor/history?from=&to=` → tabel rekap
- `GET /api/sensor/export?from=&to=` → CSV download

### Frontend — `apps/frontend/src/pages/RekapPage.tsx`

State:
```typescript
const [filter, setFilter] = useState<HistoryFilter>("7d");
const [selectedDate, setSelectedDate] = useState<string | null>(null);
```

Konsumsi `SensorContext` untuk `sensorData` (dipakai di detail panel hari ini).

**Layout:**
```
[ Header area: judul "Rekap Harian" + tombol Export CSV ]
[ Filter chips: 7 Hari | 30 Hari | Semua ]
[ Tabel rekap (full width) ]
[ Panel detail (muncul saat baris dipilih) ]
```

**Tabel rekap:**
- Kolom: Tanggal | Total Pengunjung | Aksi
- Setiap baris bisa diklik → set `selectedDate`
- Baris aktif di-highlight dengan `var(--surface-2)` + border kiri `var(--accent)`
- Loading & error state

**Panel detail** (muncul di bawah tabel saat `selectedDate !== null`):
- Header: "Detail — {selectedDate}", tombol × untuk tutup
- "Hari ini" dideteksi dengan: `selectedDate === new Date().toISOString().slice(0, 10)`
- Jika `selectedDate === today`:
  - Tampilkan `TemperatureChart` (reuse komponen, passing `sensorData` dari context)
  - Tampilkan jumlah pengunjung live (`sensorData.orang_hari_ini`)
- Jika hari lalu:
  - Tampilkan kartu ringkasan: Total Pengunjung = `entry.total`
  - Notif kecil: "Data suhu tidak tersedia untuk tanggal sebelumnya"

**Export CSV:**
- Tombol di kanan atas header area
- Mengekspor sesuai filter aktif menggunakan `filterToDates(filter)` dari `apps/frontend/src/utils/dateUtils.ts`
- Gunakan fungsi `downloadCSV` dari `apps/frontend/src/api/export.ts`

---

## File Summary

| File | Status | Keterangan |
|------|--------|-----------|
| `apps/backend/.env` | Baru | Copy credentials dari root `.env` |
| `apps/backend/src/routes/chat.ts` | Baru | POST /api/ai/chat |
| `apps/backend/src/index.ts` | Modifikasi | Register chatRoutes |
| `apps/frontend/src/hooks/useLiveSensor.ts` | Fix | `/sensor/live` → `/api/sensor/live` |
| `apps/frontend/package.json` | Modifikasi | Tambah react-router-dom |
| `apps/frontend/src/main.tsx` | Modifikasi | Pakai createBrowserRouter |
| `apps/frontend/src/App.tsx` | Modifikasi | Route config |
| `apps/frontend/src/context/SensorContext.tsx` | Baru | Shared sensor state |
| `apps/frontend/src/components/Layout.tsx` | Baru | Shared header + nav |
| `apps/frontend/src/pages/Dashboard.tsx` | Modifikasi minor | Konsumsi SensorContext (hapus useLiveSensor + useTheme calls) |
| `apps/frontend/src/pages/ChatPage.tsx` | Baru | Multi-turn AI chat |
| `apps/frontend/src/pages/RekapPage.tsx` | Baru | Rekap harian + detail + export |
| `apps/frontend/src/api/chat.ts` | Baru | sendChatMessage() |
| `apps/frontend/src/utils/dateUtils.ts` | Baru | filterToDates() dipindah dari ExportButton |
