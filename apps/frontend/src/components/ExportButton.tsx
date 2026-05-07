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
