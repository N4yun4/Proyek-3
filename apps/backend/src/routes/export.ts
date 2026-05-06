import { Elysia, t } from "elysia";
import { getHistory } from "../services/firebase";

export const exportRoutes = new Elysia({ prefix: "/api/sensor" })
  .get(
    "/export",
    async ({ query, set }) => {
      try {
        const entries = await getHistory(query.from, query.to);

        if (entries.length === 0) {
          set.status = 204;
          return;
        }

        const lines = [
          "Tanggal,Total Pengunjung",
          ...entries.map((e) => `${e.tanggal},${e.total}`),
        ];
        const csv = lines.join("\n");

        set.headers["Content-Type"] = "text/csv";
        set.headers["Content-Disposition"] =
          `attachment; filename="monitoring-${query.from ?? "all"}-${query.to ?? "all"}.csv"`;

        return csv;
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
