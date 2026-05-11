import { Elysia, t } from "elysia";
import { getHistory, getTemperatureHistory, getDayReadings } from "../services/firebase";

export const exportRoutes = new Elysia({ prefix: "/api/sensor" })
  .get(
    "/export",
    async ({ query, set }) => {
      try {
        const { from, to } = query;

        // Export 1 hari: tampilkan semua pembacaan sensor per menit
        if (from && to && from === to) {
          const readings = await getDayReadings(from);

          if (readings.length === 0) {
            set.status = 204;
            return;
          }

          const lines = [
            "Waktu,Pengunjung,Suhu (°C),Kelembapan (%)",
            ...readings.map((r) =>
              `${r.waktu},${r.orang_hari_ini},${r.suhu},${r.kelembapan}`
            ),
          ];

          set.headers["Content-Type"] = "text/csv";
          set.headers["Content-Disposition"] =
            `attachment; filename="monitoring-${from}.csv"`;
          return lines.join("\n");
        }

        // Export range: tampilkan total harian + suhu ringkasan
        const [entries, temperatures] = await Promise.all([
          getHistory(from, to),
          getTemperatureHistory(),
        ]);

        if (entries.length === 0) {
          set.status = 204;
          return;
        }

        const lines = [
          "Tanggal,Total Pengunjung,Suhu (°C),Kelembapan (%)",
          ...entries.map((e) => {
            const temp = temperatures[e.tanggal];
            return `${e.tanggal},${e.total},${temp?.suhu ?? ""},${temp?.kelembapan ?? ""}`;
          }),
        ];

        set.headers["Content-Type"] = "text/csv";
        set.headers["Content-Disposition"] =
          `attachment; filename="monitoring-${from ?? "all"}-${to ?? "all"}.csv"`;
        return lines.join("\n");
      } catch {
        set.status = 503;
        return { error: "Database tidak bisa diakses" };
      }
    },
    {
      query: t.Object({
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
      }),
    }
  );
