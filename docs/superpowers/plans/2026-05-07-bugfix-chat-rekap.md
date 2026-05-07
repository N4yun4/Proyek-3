# Bug Fix, AI Chat, Rekap Harian — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix WebSocket data bug, add shared routing with nav bar (React Router v6), multi-turn AI Chat page, and Rekap Harian page with per-day detail and CSV export.

**Architecture:** Bun monorepo — Elysia.js backend (`apps/backend`), Vite+React+TS+Tailwind frontend (`apps/frontend`). React Router v6 with a shared `Layout` component that owns sensor WebSocket state via `SensorContext`. HEARTH minimalist theme (DM Serif Display, DM Sans, `--accent: #E8714A`).

**Tech Stack:** Bun, Elysia.js, Firebase Realtime DB, OpenRouter AI (`inclusionai/ling-2.6-1t:free`), React 18, React Router DOM v6, TypeScript, Tailwind CSS v3, Chart.js.

---

### Task 1: Bug Fix — Backend .env + WebSocket URL

**Files:**
- Create: `apps/backend/.env`
- Modify: `apps/frontend/src/hooks/useLiveSensor.ts`

- [ ] **Step 1: Create `apps/backend/.env`**

  Read the root `.env` file (at the monorepo root), then create `apps/backend/.env` with the same content. Bun loads `.env` from the process working directory; the dev script runs from `apps/backend/`, so credentials must live there.

  ```
  FIREBASE_API_KEY=<copy value from root .env>
  FIREBASE_DATABASE_URL=<copy value from root .env>
  OPENROUTER_API_KEY=<copy value from root .env>
  PORT=3000
  FRONTEND_ORIGIN=http://localhost:5173
  ```

- [ ] **Step 2: Fix WebSocket URL in `apps/frontend/src/hooks/useLiveSensor.ts`**

  Current line 4 builds the wrong path (`/sensor/live`). Backend registers the route under prefix `/api/sensor` + path `/live` = `/api/sensor/live`.

  Replace lines 1–5 with:
  ```typescript
  import { useState, useEffect, useRef } from "react";
  import type { SensorData, ConnectionStatus } from "../types/sensor";

  const WS_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000")
    .replace(/^http/, "ws") + "/api/sensor/live";
  ```

- [ ] **Step 3: Verify fix**

  Run both services:
  ```powershell
  bun run dev
  ```
  Open browser → DevTools → Network → WS tab. Confirm connection to `ws://localhost:3000/api/sensor/live` shows status 101. Sensor cards should populate within seconds.

- [ ] **Step 4: Commit**
  ```powershell
  git add apps/backend/.env apps/frontend/src/hooks/useLiveSensor.ts
  git commit -m "fix: correct ws path to /api/sensor/live and add backend .env"
  ```

---

### Task 2: Shared Date Utility

**Files:**
- Create: `apps/frontend/src/utils/dateUtils.ts`
- Modify: `apps/frontend/src/components/ExportButton.tsx`

- [ ] **Step 1: Create `apps/frontend/src/utils/dateUtils.ts`**

  ```typescript
  import type { HistoryFilter } from "../types/sensor";

  export function filterToDates(filter: HistoryFilter): { from?: string; to?: string } {
    if (filter === "all") return {};
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const from = new Date(today);
    from.setDate(from.getDate() - (filter === "7d" ? 7 : 30));
    return { from: from.toISOString().slice(0, 10), to };
  }

  export function todayString(): string {
    return new Date().toISOString().slice(0, 10);
  }
  ```

- [ ] **Step 2: Update `apps/frontend/src/components/ExportButton.tsx`**

  Remove the local `filterToDates` function (lines 1–13) and replace with an import:

  ```typescript
  import { useState } from "react";
  import { downloadCSV } from "../api/export";
  import { filterToDates } from "../utils/dateUtils";
  import type { HistoryFilter } from "../types/sensor";

  interface ExportButtonProps {
    filter?: HistoryFilter;
  }

  export function ExportButton({ filter = "all" }: ExportButtonProps) {
    const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");

    async function handleExport() {
      setStatus("loading");
      try {
        const { from, to } = filterToDates(filter);
        const result = await downloadCSV(from, to);
        setStatus(result === "empty" ? "empty" : "idle");
        if (result === "empty") setTimeout(() => setStatus("idle"), 3000);
      } catch {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    }

    const isLoading = status === "loading";

    return (
      <div>
        <button
          onClick={handleExport}
          disabled={isLoading}
          className={`sh-btn w-full ${isLoading ? "sh-btn-disabled" : "sh-btn-primary"}`}
          style={{
            padding: "0.65rem 1rem",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.8rem",
            fontWeight: 500,
            letterSpacing: "0.01em",
            width: "100%",
          }}
        >
          {isLoading ? (
            "Menyiapkan…"
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M6.5 1.5v7M3.5 6l3 3 3-3M1.5 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export CSV
            </>
          )}
        </button>
        {status === "empty" && (
          <p className="mt-1.5 text-center sh-label" style={{ fontSize: "0.62rem", color: "var(--amber)" }}>
            Tidak ada data di rentang ini
          </p>
        )}
        {status === "error" && (
          <p className="mt-1.5 text-center sh-label" style={{ fontSize: "0.62rem", color: "var(--red)" }}>
            Export gagal, coba lagi
          </p>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 3: Commit**
  ```powershell
  git add apps/frontend/src/utils/dateUtils.ts apps/frontend/src/components/ExportButton.tsx
  git commit -m "refactor: extract filterToDates to shared dateUtils utility"
  ```

---

### Task 3: CSS — Chat Bounce Animation

**Files:**
- Modify: `apps/frontend/src/index.css`

- [ ] **Step 1: Append bounce-dot animation to `apps/frontend/src/index.css`**

  Add at the end of the file:

  ```css
  /* ─── Chat Loading Dots ───────────────────────────────────── */
  @keyframes bounce-dot {
    0%, 80%, 100% { transform: translateY(0);   opacity: 0.4; }
    40%            { transform: translateY(-6px); opacity: 1;   }
  }
  .bounce-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-2);
    animation: bounce-dot 1.2s ease-in-out infinite;
  }
  .bounce-dot:nth-child(2) { animation-delay: 0.2s; }
  .bounce-dot:nth-child(3) { animation-delay: 0.4s; }
  ```

- [ ] **Step 2: Commit**
  ```powershell
  git add apps/frontend/src/index.css
  git commit -m "style: add bounce-dot animation for chat loading indicator"
  ```

---

### Task 4: Install React Router DOM

**Files:**
- Modify: `apps/frontend/package.json`

- [ ] **Step 1: Install react-router-dom**

  ```powershell
  cd apps/frontend
  bun add react-router-dom@^6.26.0
  cd ../..
  ```

- [ ] **Step 2: Verify install**

  ```powershell
  bun run --cwd apps/frontend build 2>&1 | Select-String "error"
  ```
  Expected: no TypeScript errors about missing `react-router-dom`.

- [ ] **Step 3: Commit**
  ```powershell
  git add apps/frontend/package.json apps/frontend/bun.lock
  git commit -m "deps: add react-router-dom v6 to frontend"
  ```

---

### Task 5: SensorContext

**Files:**
- Create: `apps/frontend/src/context/SensorContext.tsx`

- [ ] **Step 1: Create `apps/frontend/src/context/SensorContext.tsx`**

  ```typescript
  import { createContext, useContext } from "react";
  import type { SensorData, ConnectionStatus } from "../types/sensor";

  export interface SensorContextValue {
    sensorData: SensorData | null;
    status: ConnectionStatus;
  }

  export const SensorContext = createContext<SensorContextValue>({
    sensorData: null,
    status: "connecting",
  });

  export function useSensor(): SensorContextValue {
    return useContext(SensorContext);
  }
  ```

- [ ] **Step 2: Commit**
  ```powershell
  git add apps/frontend/src/context/SensorContext.tsx
  git commit -m "feat: add SensorContext for shared sensor state across pages"
  ```

---

### Task 6: Layout Component

**Files:**
- Create: `apps/frontend/src/components/Layout.tsx`

- [ ] **Step 1: Create `apps/frontend/src/components/Layout.tsx`**

  ```typescript
  import { Outlet, NavLink } from "react-router-dom";
  import { useLiveSensor } from "../hooks/useLiveSensor";
  import { useTheme } from "../hooks/useTheme";
  import { ThemeToggle } from "./ThemeToggle";
  import { SensorContext } from "../context/SensorContext";
  import type { ConnectionStatus } from "../types/sensor";

  const statusCfg: Record<ConnectionStatus, { label: string; color: string; dot: string; pulse: boolean }> = {
    connecting:   { label: "Menghubungkan", color: "#F5A623", dot: "#F5A623", pulse: true  },
    connected:    { label: "Terhubung",      color: "#5BAD7F", dot: "#5BAD7F", pulse: false },
    disconnected: { label: "Terputus",       color: "#E85454", dot: "#E85454", pulse: true  },
  };

  const navLinks = [
    { to: "/",      label: "Dashboard",    end: true  },
    { to: "/chat",  label: "AI Chat",      end: false },
    { to: "/rekap", label: "Rekap Harian", end: false },
  ];

  export function Layout() {
    const { sensorData, status } = useLiveSensor();
    const { theme, toggleTheme } = useTheme();
    const conn = statusCfg[status];

    return (
      <SensorContext.Provider value={{ sensorData, status }}>
        <div className="sh-bg" style={{ minHeight: "100vh", color: "var(--text)" }}>

          {/* ── Header ─────────────────────────────────────────── */}
          <header
            style={{
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
              position: "sticky",
              top: 0,
              zIndex: 100,
            }}
          >
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="sh-display" style={{ fontSize: "1.5rem" }}>Home Monitor</h1>
                <p className="sh-label mt-0.5" style={{ fontSize: "0.62rem" }}>
                  Pemantauan Kondisi Ruangan · Real-Time
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div style={{ position: "relative", width: "8px", height: "8px", flexShrink: 0 }}>
                    <span
                      style={{
                        display: "block",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: conn.dot,
                      }}
                    />
                    {conn.pulse && (
                      <span className="pulse-ring" style={{ color: conn.dot }} />
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: conn.color,
                    }}
                  >
                    {conn.label}
                  </span>
                </div>
                <div style={{ width: "1px", height: "18px", background: "var(--border-hi)", flexShrink: 0 }} />
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
              </div>
            </div>

            {/* Nav bar */}
            <div style={{ borderTop: "1px solid var(--border)" }}>
              <div className="max-w-6xl mx-auto px-6">
                <nav className="flex gap-1 py-1.5">
                  {navLinks.map(({ to, label, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      style={({ isActive }) => ({
                        fontFamily: "var(--font-body)",
                        fontSize: "0.78rem",
                        fontWeight: 500,
                        padding: "0.35rem 0.85rem",
                        borderRadius: "8px",
                        textDecoration: "none",
                        transition: "all 0.15s ease",
                        background: isActive ? "var(--accent)" : "transparent",
                        color: isActive ? "#fff" : "var(--text-2)",
                      })}
                    >
                      {label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </div>
          </header>

          {/* Page content */}
          <Outlet />
        </div>
      </SensorContext.Provider>
    );
  }
  ```

- [ ] **Step 2: Commit**
  ```powershell
  git add apps/frontend/src/components/Layout.tsx
  git commit -m "feat: add Layout component with sticky header and nav bar"
  ```

---

### Task 7: Wire Up Router — App.tsx + main.tsx + Dashboard.tsx

**Files:**
- Modify: `apps/frontend/src/App.tsx`
- Modify: `apps/frontend/src/main.tsx`
- Modify: `apps/frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Create stub pages so TypeScript doesn't error on import**

  Create `apps/frontend/src/pages/ChatPage.tsx`:
  ```typescript
  export function ChatPage() {
    return <main className="max-w-6xl mx-auto px-6 py-7"><p>AI Chat — coming soon</p></main>;
  }
  ```

  Create `apps/frontend/src/pages/RekapPage.tsx`:
  ```typescript
  export function RekapPage() {
    return <main className="max-w-6xl mx-auto px-6 py-7"><p>Rekap Harian — coming soon</p></main>;
  }
  ```

- [ ] **Step 2: Rewrite `apps/frontend/src/App.tsx`**

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
        { index: true,      element: <Dashboard /> },
        { path: "chat",     element: <ChatPage />  },
        { path: "rekap",    element: <RekapPage /> },
      ],
    },
  ]);

  export default function App() {
    return <RouterProvider router={router} />;
  }
  ```

- [ ] **Step 3: `apps/frontend/src/main.tsx` — no changes needed**

  `main.tsx` already renders `<App />` which now contains `RouterProvider`. Verify it still reads:
  ```typescript
  import { StrictMode } from "react";
  import { createRoot } from "react-dom/client";
  import "./index.css";
  import App from "./App";

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  ```

- [ ] **Step 4: Rewrite `apps/frontend/src/pages/Dashboard.tsx`**

  Remove the full-page wrapper, header, status bar, and theme toggle — those now live in `Layout`. Replace `useLiveSensor()` + `useTheme()` with `useSensor()` from context.

  ```typescript
  import { useSensor } from "../context/SensorContext";
  import { SensorCard } from "../components/SensorCard";
  import { TemperatureChart } from "../components/TemperatureChart";
  import { HistoryTable } from "../components/HistoryTable";
  import { AIAnalysis } from "../components/AIAnalysis";
  import { ExportButton } from "../components/ExportButton";

  function IconTemp() {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2.5v7.2" stroke="#4A8FE7" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="13" r="2.5" fill="#4A8FE7" fillOpacity="0.2" stroke="#4A8FE7" strokeWidth="1.4"/>
        <path d="M7 5h4M7 7.5h4" stroke="#4A8FE7" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      </svg>
    );
  }

  function IconHumidity() {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 3L5 9.5a4 4 0 1 0 8 0L9 3z" fill="#5BAD7F" fillOpacity="0.15" stroke="#5BAD7F" strokeWidth="1.4" strokeLinejoin="round"/>
      </svg>
    );
  }

  function IconPeople() {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="7" cy="6" r="2.5" stroke="#E8714A" strokeWidth="1.4"/>
        <path d="M2 15c0-3 2.2-5 5-5s5 2 5 5" stroke="#E8714A" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="13" cy="6.5" r="2" stroke="#E8714A" strokeWidth="1.2" opacity="0.6"/>
        <path d="M16 15c0-2.5-1.4-4-3-4.5" stroke="#E8714A" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      </svg>
    );
  }

  export function Dashboard() {
    const { sensorData } = useSensor();

    return (
      <main className="max-w-6xl mx-auto px-6 py-7 space-y-5">
        {/* Sensor cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="fade-up fade-up-1">
            <SensorCard
              label="Suhu Ruangan"
              value={sensorData?.suhu ?? null}
              unit="°C"
              icon={<IconTemp />}
              color="blue"
            />
          </div>
          <div className="fade-up fade-up-2">
            <SensorCard
              label="Kelembapan"
              value={sensorData?.kelembapan ?? null}
              unit="%"
              icon={<IconHumidity />}
              color="green"
            />
          </div>
          <div className="fade-up fade-up-3">
            <SensorCard
              label="Pengunjung Hari Ini"
              value={sensorData?.orang_hari_ini ?? null}
              unit="orang"
              icon={<IconPeople />}
              color="amber"
            />
          </div>
        </div>

        {/* Chart + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 fade-up fade-up-4">
            <TemperatureChart sensorData={sensorData} />
          </div>
          <div className="flex flex-col gap-4 fade-up fade-up-5">
            <AIAnalysis sensorData={sensorData} />
            <ExportButton filter="7d" />
            <HistoryTable />
          </div>
        </div>

        <p className="text-center sh-label pb-3" style={{ fontSize: "0.6rem" }}>
          Home Monitor · IoT Room Monitoring · POLNES TRK 6C 2025
        </p>
      </main>
    );
  }
  ```

- [ ] **Step 5: Verify app still runs**
  ```powershell
  bun run dev
  ```
  Open `http://localhost:5173`. Dashboard should render with nav bar. Sensor data should appear (bug fixed in Task 1). Check browser console for errors.

- [ ] **Step 6: Commit**
  ```powershell
  git add apps/frontend/src/App.tsx apps/frontend/src/main.tsx apps/frontend/src/pages/Dashboard.tsx apps/frontend/src/pages/ChatPage.tsx apps/frontend/src/pages/RekapPage.tsx
  git commit -m "feat: wire React Router v6 with Layout, update Dashboard to use SensorContext"
  ```

---

### Task 8: Backend Chat Route

**Files:**
- Create: `apps/backend/src/routes/chat.ts`
- Modify: `apps/backend/src/index.ts`

- [ ] **Step 1: Create `apps/backend/src/routes/chat.ts`**

  ```typescript
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
  ```

- [ ] **Step 2: Register in `apps/backend/src/index.ts`**

  ```typescript
  import { Elysia } from "elysia";
  import { cors } from "@elysiajs/cors";
  import { sensorRoutes } from "./routes/sensor";
  import { exportRoutes } from "./routes/export";
  import { aiRoutes } from "./routes/ai";
  import { chatRoutes } from "./routes/chat";

  const app = new Elysia()
    .use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173" }))
    .use(sensorRoutes)
    .use(exportRoutes)
    .use(aiRoutes)
    .use(chatRoutes)
    .get("/health", () => ({ status: "ok" }))
    .listen(Number(process.env.PORT ?? 3000));

  console.log(`Backend running at http://localhost:${app.server?.port}`);
  ```

- [ ] **Step 3: Test the endpoint**
  ```powershell
  bun run dev:backend
  ```
  In a separate terminal:
  ```powershell
  $body = '{"messages":[{"role":"user","content":"Bagaimana kondisi ruangan?"}],"sensorContext":{"suhu":28,"kelembapan":65,"orang_hari_ini":5}}'
  Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/ai/chat" -ContentType "application/json" -Body $body
  ```
  Expected: `{ reply: "..." }` with a non-empty Indonesian string.

- [ ] **Step 4: Commit**
  ```powershell
  git add apps/backend/src/routes/chat.ts apps/backend/src/index.ts
  git commit -m "feat: add POST /api/ai/chat endpoint for multi-turn conversation"
  ```

---

### Task 9: Frontend Chat API

**Files:**
- Create: `apps/frontend/src/api/chat.ts`

- [ ] **Step 1: Create `apps/frontend/src/api/chat.ts`**

  ```typescript
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
  ```

- [ ] **Step 2: Commit**
  ```powershell
  git add apps/frontend/src/api/chat.ts
  git commit -m "feat: add sendChatMessage API client for multi-turn chat"
  ```

---

### Task 10: ChatPage

**Files:**
- Create: `apps/frontend/src/pages/ChatPage.tsx`

- [ ] **Step 1: Create `apps/frontend/src/pages/ChatPage.tsx`**

  ```typescript
  import { useState, useRef, useEffect } from "react";
  import { useSensor } from "../context/SensorContext";
  import { sendChatMessage } from "../api/chat";
  import type { ChatMessage } from "../api/chat";

  export function ChatPage() {
    const { sensorData } = useSensor();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    async function handleSend() {
      const text = input.trim();
      if (!text || loading) return;

      const userMsg: ChatMessage = { role: "user", content: text };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        const reply = await sendChatMessage({
          messages: nextMessages,
          sensorContext: sensorData
            ? { suhu: sensorData.suhu, kelembapan: sensorData.kelembapan, orang_hari_ini: sensorData.orang_hari_ini }
            : undefined,
        });
        setMessages([...nextMessages, { role: "assistant", content: reply }]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Chat gagal");
      } finally {
        setLoading(false);
      }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    }

    return (
      <main className="max-w-6xl mx-auto px-6 py-7">
        <div
          className="sh-card"
          style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 172px)" }}
        >
          {/* Card header */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div>
              <p className="sh-label mb-0.5" style={{ fontSize: "0.6rem" }}>Asisten Ruangan</p>
              <h2
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "var(--text)",
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                AI Chat
              </h2>
            </div>
            <button
              onClick={() => { setMessages([]); setError(null); setInput(""); }}
              className="sh-btn sh-btn-ghost"
              style={{ fontSize: "0.72rem", padding: "0.3rem 0.75rem" }}
            >
              Percakapan Baru
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1.25rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {/* Welcome */}
            {messages.length === 0 && !loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    maxWidth: "75%",
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    borderRadius: "18px 18px 18px 4px",
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.6,
                  }}
                >
                  Halo! Saya siap membantu menganalisis kondisi ruangan. Tanyakan apa saja.
                </div>
              </div>
            )}

            {/* Bubble messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    background: msg.role === "user" ? "var(--accent)" : "var(--surface-2)",
                    color: msg.role === "user" ? "#fff" : "var(--text)",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    background: "var(--surface-2)",
                    borderRadius: "18px 18px 18px 4px",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  <span className="bounce-dot" />
                  <span className="bounce-dot" />
                  <span className="bounce-dot" />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.78rem",
                  color: "var(--red)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {error}{" "}
                <button
                  onClick={() => void handleSend()}
                  style={{
                    color: "var(--accent)",
                    textDecoration: "underline",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.78rem",
                  }}
                >
                  Coba lagi
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              padding: "1rem 1.5rem",
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-end",
              flexShrink: 0,
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Ketik pesan… (Enter untuk kirim, Shift+Enter baris baru)"
              rows={1}
              style={{
                flex: 1,
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                color: "var(--text)",
                background: "var(--surface-2)",
                border: "1px solid var(--border-hi)",
                borderRadius: "12px",
                padding: "0.65rem 0.9rem",
                resize: "none",
                outline: "none",
                lineHeight: 1.5,
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-hi)"; }}
            />
            <button
              onClick={() => void handleSend()}
              disabled={loading || !input.trim()}
              className={`sh-btn ${loading || !input.trim() ? "sh-btn-disabled" : "sh-btn-primary"}`}
              style={{ padding: "0.65rem 1.1rem", fontSize: "0.8rem", borderRadius: "12px", flexShrink: 0 }}
            >
              Kirim
            </button>
          </div>
        </div>
      </main>
    );
  }
  ```

- [ ] **Step 2: Verify ChatPage**

  Open `http://localhost:5173/chat`. Confirm:
  - Nav link "AI Chat" is highlighted
  - Chat card fills the viewport height
  - Welcome message appears
  - Typing a message and pressing Enter sends it
  - Loading dots appear, then AI reply bubble appears on the left
  - "Percakapan Baru" clears the chat

- [ ] **Step 3: Commit**
  ```powershell
  git add apps/frontend/src/pages/ChatPage.tsx
  git commit -m "feat: add multi-turn AI Chat page at /chat"
  ```

---

### Task 11: RekapPage

**Files:**
- Create: `apps/frontend/src/pages/RekapPage.tsx`

- [ ] **Step 1: Create `apps/frontend/src/pages/RekapPage.tsx`**

  ```typescript
  import { useState } from "react";
  import { useSensor } from "../context/SensorContext";
  import { useHistory } from "../hooks/useHistory";
  import { TemperatureChart } from "../components/TemperatureChart";
  import { downloadCSV } from "../api/export";
  import { filterToDates, todayString } from "../utils/dateUtils";
  import type { HistoryFilter } from "../types/sensor";

  const FILTERS: { label: string; value: HistoryFilter }[] = [
    { label: "7 Hari",  value: "7d"  },
    { label: "30 Hari", value: "30d" },
    { label: "Semua",   value: "all" },
  ];

  export function RekapPage() {
    const { sensorData } = useSensor();
    const [filter, setFilter] = useState<HistoryFilter>("7d");
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [exportStatus, setExportStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");
    const { data, loading, error } = useHistory(filter);

    const today = todayString();
    const selectedEntry = data.find((e) => e.tanggal === selectedDate);

    async function handleExport() {
      setExportStatus("loading");
      try {
        const { from, to } = filterToDates(filter);
        const result = await downloadCSV(from, to);
        setExportStatus(result === "empty" ? "empty" : "idle");
        if (result === "empty") setTimeout(() => setExportStatus("idle"), 3000);
      } catch {
        setExportStatus("error");
        setTimeout(() => setExportStatus("idle"), 3000);
      }
    }

    function toggleDate(date: string) {
      setSelectedDate((prev) => (prev === date ? null : date));
    }

    return (
      <main className="max-w-6xl mx-auto px-6 py-7 space-y-4">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="sh-label mb-0.5" style={{ fontSize: "0.62rem" }}>Statistik Harian</p>
            <h2 className="sh-display" style={{ fontSize: "1.5rem" }}>Rekap Harian</h2>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {exportStatus === "empty" && (
              <span className="sh-label" style={{ fontSize: "0.62rem", color: "var(--amber)" }}>Tidak ada data</span>
            )}
            {exportStatus === "error" && (
              <span className="sh-label" style={{ fontSize: "0.62rem", color: "var(--red)" }}>Export gagal</span>
            )}
            <button
              onClick={() => void handleExport()}
              disabled={exportStatus === "loading"}
              className={`sh-btn ${exportStatus === "loading" ? "sh-btn-disabled" : "sh-btn-primary"}`}
              style={{ fontSize: "0.78rem", padding: "0.5rem 1rem", borderRadius: "10px" }}
            >
              {exportStatus === "loading" ? (
                "Menyiapkan…"
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M6 1v7M3 5.5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setSelectedDate(null); }}
              className={`sh-chip ${filter === f.value ? "sh-chip-active" : "sh-chip-inactive"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="sh-card" style={{ overflow: "hidden" }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th
                  className="sh-label text-left"
                  style={{ padding: "0.85rem 1.25rem", fontSize: "0.62rem" }}
                >
                  Tanggal
                </th>
                <th
                  className="sh-label text-right"
                  style={{ padding: "0.85rem 1.25rem", fontSize: "0.62rem" }}
                >
                  Total Pengunjung
                </th>
                <th style={{ padding: "0.85rem 1.25rem", width: "50px" }} />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={3} className="sh-label text-center" style={{ padding: "2.5rem", fontSize: "0.65rem" }}>
                    memuat data…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td
                    colSpan={3}
                    style={{ padding: "2.5rem", textAlign: "center", color: "var(--red)", fontSize: "0.8rem", fontFamily: "var(--font-body)" }}
                  >
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && data.length === 0 && (
                <tr>
                  <td colSpan={3} className="sh-label text-center" style={{ padding: "2.5rem", fontSize: "0.65rem" }}>
                    belum ada data
                  </td>
                </tr>
              )}
              {!loading && !error && data.map((entry) => {
                const isSelected = selectedDate === entry.tanggal;
                const isToday = entry.tanggal === today;
                return (
                  <tr
                    key={entry.tanggal}
                    className="data-row"
                    onClick={() => toggleDate(entry.tanggal)}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent",
                      background: isSelected ? "var(--surface-2)" : undefined,
                    }}
                  >
                    <td style={{ padding: "0.85rem 1.25rem", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--text)" }}>
                      {entry.tanggal}
                      {isToday && (
                        <span
                          className="sh-label"
                          style={{
                            marginLeft: "0.5rem",
                            fontSize: "0.58rem",
                            color: "var(--accent)",
                            background: "rgba(232,113,74,0.1)",
                            padding: "0.1rem 0.45rem",
                            borderRadius: "20px",
                          }}
                        >
                          Hari ini
                        </span>
                      )}
                    </td>
                    <td
                      className="text-right tabular-nums"
                      style={{
                        padding: "0.85rem 1.25rem",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "#5BAD7F",
                      }}
                    >
                      {entry.total}
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem", textAlign: "center" }}>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: "var(--text-3)",
                          display: "inline-block",
                          transform: isSelected ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s ease",
                        }}
                      >
                        ▼
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selectedDate && (
          <div className="sh-card p-6 fade-up fade-up-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="sh-label mb-0.5" style={{ fontSize: "0.6rem" }}>Detail Rekap</p>
                <h3
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "var(--text)",
                    letterSpacing: "-0.01em",
                    margin: 0,
                  }}
                >
                  {selectedDate}
                  {selectedDate === today && (
                    <span className="sh-label" style={{ marginLeft: "0.5rem", fontSize: "0.58rem", color: "var(--accent)" }}>
                      • Hari ini
                    </span>
                  )}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-2)",
                  fontSize: "1.2rem",
                  lineHeight: 1,
                  padding: "0.25rem 0.5rem",
                  borderRadius: "6px",
                }}
              >
                ×
              </button>
            </div>

            <div className="sh-divider mb-5" />

            {selectedDate === today ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <p className="sh-label mb-2" style={{ fontSize: "0.6rem" }}>Pengunjung Live</p>
                    <div className="sh-value" style={{ fontSize: "2.2rem", color: "#E8714A" }}>
                      {sensorData?.orang_hari_ini ?? "—"}
                      <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--text-2)", marginLeft: "0.3rem" }}>orang</span>
                    </div>
                  </div>
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <p className="sh-label mb-2" style={{ fontSize: "0.6rem" }}>Total Tercatat</p>
                    <div className="sh-value" style={{ fontSize: "2.2rem", color: "#5BAD7F" }}>
                      {selectedEntry?.total ?? "—"}
                      <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--text-2)", marginLeft: "0.3rem" }}>orang</span>
                    </div>
                  </div>
                </div>
                <TemperatureChart sensorData={sensorData} />
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "var(--surface-2)" }}
                >
                  <p className="sh-label mb-2" style={{ fontSize: "0.6rem" }}>Total Pengunjung</p>
                  <div className="sh-value" style={{ fontSize: "2.2rem", color: "#5BAD7F" }}>
                    {selectedEntry?.total ?? "—"}
                    <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--text-2)", marginLeft: "0.3rem" }}>orang</span>
                  </div>
                </div>
                <p className="sh-label" style={{ fontSize: "0.65rem" }}>
                  Data suhu tidak tersedia untuk tanggal sebelumnya
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    );
  }
  ```

- [ ] **Step 2: Verify RekapPage**

  Open `http://localhost:5173/rekap`. Confirm:
  - Nav link "Rekap Harian" is highlighted
  - Table shows history rows with filter chips
  - Clicking a past-day row shows visitor count + "Data suhu tidak tersedia…"
  - Clicking today's row shows live visitor count + temperature chart
  - Clicking the row again (or ×) collapses the detail panel
  - Export CSV downloads a file

- [ ] **Step 3: Commit**
  ```powershell
  git add apps/frontend/src/pages/RekapPage.tsx
  git commit -m "feat: add Rekap Harian page at /rekap with detail panel and CSV export"
  ```
