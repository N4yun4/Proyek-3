# Aplikasi Monitoring Ruangan IoT

Aplikasi monitoring ruangan berbasis IoT yang menampilkan data sensor secara real-time, dilengkapi analisis AI dan chat asisten cerdas. Dikembangkan sebagai Proyek 3 — Teknik Rekayasa Komputer 6C, Politeknik Negeri Samarinda (POLNES) 2025.

---

## Fitur Utama

- **Dashboard Real-Time** — Pantau suhu, kelembapan, dan jumlah pengunjung secara langsung via WebSocket
- **Grafik Historis** — Visualisasi tren suhu dan kepadatan ruangan dengan filter 7 hari, 30 hari, atau semua data
- **Analisis AI** — Analisis kondisi ruangan otomatis menggunakan NVIDIA NIM, dikalibrasi untuk iklim Samarinda
- **AI Chat** — Asisten berbasis AI yang memahami konteks sensor dan iklim Samarinda; mendukung percakapan multi-turn dengan quick prompts, markdown rendering, dan sensor bar live
- **Rekap Harian** — Lihat detail pembacaan sensor per jam, lengkap dengan analisis keamanan AI
- **Export CSV** — Unduh data historis sebagai file CSV
- **Dark / Light Mode** — Dukungan tema gelap dan terang

---

## Teknologi

| Layer | Teknologi |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Backend | [Elysia.js](https://elysiajs.com) |
| Database | Firebase Realtime Database |
| AI | NVIDIA NIM API (`openai/gpt-oss-20b`) |
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + CSS Variables (Design System) |
| Charts | Chart.js + react-chartjs-2 |
| Markdown | react-markdown + remark-gfm |

---

## Struktur Proyek

```
Aplikasi Monitoring/
├── apps/
│   ├── backend/
│   │   └── src/
│   │       ├── index.ts           # Entry point server (port 3000)
│   │       ├── loadEnv.ts         # Loader .env manual (sebelum Firebase init)
│   │       ├── routes/
│   │       │   ├── sensor.ts      # GET realtime, history, readings, WebSocket live
│   │       │   ├── ai.ts          # POST analyze, analyze-security
│   │       │   ├── chat.ts        # POST /api/ai/chat (multi-turn)
│   │       │   └── export.ts      # GET export CSV
│   │       └── services/
│   │           ├── firebase.ts    # Koneksi Firebase Realtime DB
│   │           └── openrouter.ts  # Integrasi NVIDIA NIM AI
│   └── frontend/
│       └── src/
│           ├── pages/
│           │   ├── Dashboard.tsx  # Halaman utama monitoring
│           │   ├── ChatPage.tsx   # Halaman AI Chat
│           │   └── RekapPage.tsx  # Rekap harian + analisis keamanan
│           ├── components/        # SensorCard, TemperatureChart, AIAnalysis, dll
│           ├── context/           # SensorContext (data global)
│           ├── hooks/             # useLiveSensor, useHistory, useDayReadings
│           └── api/               # Fungsi fetch ke backend
├── .env                           # Environment variables (tidak di-commit)
└── package.json                   # Workspace scripts (concurrently)
```

---

## Instalasi & Menjalankan

### Prasyarat

- [Bun](https://bun.sh) v1.0+
- Akun [Firebase](https://firebase.google.com) dengan Realtime Database aktif
- API Key [NVIDIA NIM](https://integrate.api.nvidia.com)

### 1. Clone Repository

```bash
git clone https://github.com/N4yun4/Proyek-3.git
cd Proyek-3
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Konfigurasi Environment

Buat file `.env` di root proyek:

```env
# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# NVIDIA NIM
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxx
NVIDIA_MODEL=openai/gpt-oss-20b

# Server
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
```

Untuk frontend, buat `apps/frontend/.env` (opsional, default ke `http://localhost:3000`):

```env
VITE_API_URL=http://localhost:3000
```

### 4. Jalankan Aplikasi

Jalankan backend dan frontend sekaligus:

```bash
bun run dev
```

Atau jalankan terpisah:

```bash
# Backend saja
bun run dev:backend

# Frontend saja
bun run dev:frontend
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |

---

## API Endpoints

### Sensor

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/sensor/realtime` | Data sensor terkini |
| `GET` | `/api/sensor/history` | Riwayat harian (opsional: `?from=YYYY-MM-DD&to=YYYY-MM-DD`) |
| `GET` | `/api/sensor/readings/:date` | Semua pembacaan per menit untuk tanggal tertentu |
| `WS` | `/api/sensor/live` | Stream data real-time via WebSocket |
| `GET` | `/api/sensor/export` | Download CSV riwayat |

### AI

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/ai/analyze` | Analisis kondisi ruangan saat ini |
| `POST` | `/api/ai/analyze-security` | Analisis keamanan berdasarkan log harian |
| `POST` | `/api/ai/chat` | Percakapan multi-turn dengan asisten AI |

### Health

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/health` | Status server |

---

## Struktur Data Firebase

```
/sensor
  /realtime
    suhu: number
    kelembapan: number
    orang_hari_ini: number
    tanggal: string (YYYY-MM-DD)
  /orang_harian
    YYYY-MM-DD: number
  /suhu_harian
    YYYY-MM-DD:
      suhu: number
      kelembapan: number
  /readings
    YYYY-MM-DD:
      HH:mm:ss:
        suhu: number
        kelembapan: number
        orang_hari_ini: number
```

---

## Konteks Iklim

Aplikasi ini dikalibrasi untuk kondisi iklim **Samarinda, Kalimantan Timur**:

| Kondisi | Rentang |
|---|---|
| Suhu ruangan normal | 27 – 33°C |
| Suhu panas berlebih | 34 – 36°C |
| Suhu kritis | > 36°C |
| Kelembapan normal | 65 – 85% |
| Kelembapan tinggi | > 85% |

Semua analisis dan respons AI mengacu pada rentang ini.

---

## Build Production

```bash
bun run build
```

Output tersedia di `apps/frontend/dist/`.

---

## Lisensi

Proyek akademik — Politeknik Negeri Samarinda © 2025
