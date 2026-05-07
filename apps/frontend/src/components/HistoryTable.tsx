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
    <div className="orb-card orb-card-green p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="orb-label mb-0.5">Data Historis</p>
          <h2
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#6ee7b7",
              letterSpacing: "0.04em",
            }}
          >
            RIWAYAT PENGUNJUNG
          </h2>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`filter-chip ${filter === f.value ? "filter-chip-active" : "filter-chip-inactive"}`}
              style={filter === f.value ? { borderColor: "rgba(52,211,153,0.45)", color: "#6ee7b7", background: "rgba(52,211,153,0.12)" } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="orb-divider mb-3" />

      {/* Table area */}
      <div className="overflow-y-auto" style={{ maxHeight: "220px" }}>
        {loading && (
          <div className="py-8 text-center orb-label" style={{ fontSize: "0.7rem" }}>
            memuat data…
          </div>
        )}
        {error && (
          <div className="py-8 text-center" style={{ color: "var(--red)", fontSize: "0.75rem", fontFamily: "var(--font-body)" }}>
            {error}
          </div>
        )}
        {!loading && !error && data.length === 0 && (
          <div className="py-8 text-center orb-label" style={{ fontSize: "0.7rem" }}>
            belum ada data riwayat
          </div>
        )}
        {!loading && !error && data.length > 0 && (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  className="orb-label pb-2 text-left"
                  style={{ fontSize: "0.6rem", borderBottom: "1px solid rgba(52,211,153,0.1)" }}
                >
                  Tanggal
                </th>
                <th
                  className="orb-label pb-2 text-right"
                  style={{ fontSize: "0.6rem", borderBottom: "1px solid rgba(52,211,153,0.1)" }}
                >
                  Pengunjung
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr
                  key={entry.tanggal}
                  className="data-row"
                  style={{ borderBottom: "1px solid rgba(52,211,153,0.05)" }}
                >
                  <td
                    className="py-1.5"
                    style={{ fontSize: "0.78rem", fontFamily: "var(--font-body)", color: "var(--text)" }}
                  >
                    {entry.tanggal}
                  </td>
                  <td
                    className="py-1.5 text-right tabular-nums"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#34d399",
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
