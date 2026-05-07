import { useState } from "react";
import { downloadCSV } from "../api/export";
import type { HistoryFilter } from "../types/sensor";

function filterToDates(filter: HistoryFilter): { from?: string; to?: string } {
  if (filter === "all") return {};
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const from = new Date(today);
  from.setDate(from.getDate() - (filter === "7d" ? 7 : 30));
  return { from: from.toISOString().slice(0, 10), to };
}

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
        className={`orb-btn w-full ${isLoading ? "orb-btn-disabled" : "orb-btn-primary"}`}
        style={{
          padding: "0.6rem 1rem",
          borderRadius: "10px",
          fontSize: "0.72rem",
          letterSpacing: "0.08em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}
      >
        {/* Icon */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M6 1v7M3 5.5l3 3 3-3M1 10h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {isLoading ? "MENYIAPKAN…" : "EXPORT CSV"}
      </button>

      {status === "empty" && (
        <p
          className="mt-2 text-center orb-label"
          style={{ fontSize: "0.6rem", color: "var(--amber)" }}
        >
          tidak ada data di rentang ini
        </p>
      )}
      {status === "error" && (
        <p
          className="mt-2 text-center orb-label"
          style={{ fontSize: "0.6rem", color: "var(--red)" }}
        >
          export gagal, coba lagi
        </p>
      )}
    </div>
  );
}
