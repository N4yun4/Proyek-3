import { useState } from "react";
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
    <div className="sh-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="sh-label mb-0.5">Data Historis</p>
          <h3
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.88rem",
              fontWeight: 600,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            Riwayat Pengunjung
          </h3>
        </div>

        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`sh-chip ${filter === f.value ? "sh-chip-active" : "sh-chip-inactive"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sh-divider mb-3" />

      {/* Table body */}
      <div className="overflow-y-auto" style={{ maxHeight: "210px" }}>
        {loading && (
          <div className="py-8 text-center sh-label" style={{ fontSize: "0.65rem" }}>
            memuat data…
          </div>
        )}
        {error && (
          <div
            className="py-8 text-center"
            style={{ color: "var(--red)", fontSize: "0.78rem", fontFamily: "var(--font-body)" }}
          >
            {error}
          </div>
        )}
        {!loading && !error && data.length === 0 && (
          <div className="py-8 text-center sh-label" style={{ fontSize: "0.65rem" }}>
            belum ada data riwayat
          </div>
        )}
        {!loading && !error && data.length > 0 && (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  className="sh-label pb-2 text-left"
                  style={{ fontSize: "0.6rem", borderBottom: "1px solid var(--border)" }}
                >
                  Tanggal
                </th>
                <th
                  className="sh-label pb-2 text-right"
                  style={{ fontSize: "0.6rem", borderBottom: "1px solid var(--border)" }}
                >
                  Pengunjung
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr
                  key={entry.tanggal}
                  className="data-row rounded-lg"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td
                    className="py-2"
                    style={{
                      fontSize: "0.8rem",
                      fontFamily: "var(--font-body)",
                      color: "var(--text)",
                    }}
                  >
                    {entry.tanggal}
                  </td>
                  <td
                    className="py-2 text-right tabular-nums"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: "#5BAD7F",
                    }}
                  >
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
