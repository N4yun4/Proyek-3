import { useState } from "react";
import clsx from "clsx";
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

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={status === "loading"}
        className={clsx(
          "w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2",
          status === "loading"
            ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        )}
      >
        {status === "loading" ? "⏳ Menyiapkan..." : "📥 Export CSV"}
      </button>
      {status === "empty" && (
        <p className="mt-2 text-xs text-center text-yellow-500">
          Tidak ada data di rentang ini
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-xs text-center text-red-400">Export gagal, coba lagi</p>
      )}
    </div>
  );
}
