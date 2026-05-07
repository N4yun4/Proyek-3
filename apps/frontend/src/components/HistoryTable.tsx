import { useState } from "react";
import clsx from "clsx";
import { useHistory } from "../hooks/useHistory";
import type { HistoryFilter } from "../types/sensor";

const FILTERS: { label: string; value: HistoryFilter }[] = [
  { label: "7 Hari", value: "7d" },
  { label: "30 Hari", value: "30d" },
  { label: "Semua", value: "all" },
];

export function HistoryTable() {
  const [filter, setFilter] = useState<HistoryFilter>("7d");
  const { data, loading, error } = useHistory(filter);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
          Riwayat Pengunjung
        </h2>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={clsx(
                "px-3 py-1 text-xs rounded-lg transition-colors duration-150",
                filter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto max-h-72">
        {loading && (
          <div className="text-center py-8 text-gray-400 text-sm">Memuat data...</div>
        )}
        {error && (
          <div className="text-center py-8 text-red-400 text-sm">{error}</div>
        )}
        {!loading && !error && data.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Belum ada data riwayat
          </div>
        )}
        {!loading && !error && data.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="pb-2 text-left font-medium">Tanggal</th>
                <th className="pb-2 text-right font-medium">Pengunjung</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr
                  key={entry.tanggal}
                  className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-2 text-gray-700 dark:text-gray-300">{entry.tanggal}</td>
                  <td className="py-2 text-right font-semibold text-emerald-500">
                    {entry.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
