import clsx from "clsx";

interface SensorCardProps {
  label: string;
  value: number | string | null;
  unit: string;
  icon: string;
  color: "blue" | "cyan" | "emerald";
}

const colorMap = {
  blue: "border-blue-500 text-blue-400",
  cyan: "border-cyan-500 text-cyan-400",
  emerald: "border-emerald-500 text-emerald-400",
};

const bgMap = {
  blue: "bg-blue-500/10",
  cyan: "bg-cyan-500/10",
  emerald: "bg-emerald-500/10",
};

export function SensorCard({ label, value, unit, icon, color }: SensorCardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-6 transition-colors duration-200",
        "bg-white dark:bg-gray-900",
        "border-gray-200 dark:border-gray-800",
        "shadow-sm"
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-xl", bgMap[color])}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className={clsx("text-4xl font-bold tabular-nums", colorMap[color])}>
        {value ?? "—"}
        <span className="text-lg ml-1 font-normal text-gray-400">{unit}</span>
      </div>
    </div>
  );
}
