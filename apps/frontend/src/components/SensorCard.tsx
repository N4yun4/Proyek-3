interface SensorCardProps {
  label: string;
  value: number | string | null;
  unit: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "amber";
}

const colorMap = {
  blue:  { accent: "#4A8FE7", bg: "rgba(74,143,231,0.1)",  text: "#4A8FE7"  },
  green: { accent: "#5BAD7F", bg: "rgba(91,173,127,0.1)",  text: "#5BAD7F"  },
  amber: { accent: "#E8714A", bg: "rgba(232,113,74,0.1)",  text: "#E8714A"  },
};

export function SensorCard({ label, value, unit, icon, color }: SensorCardProps) {
  const c = colorMap[color];
  const live = value !== null;

  return (
    <div className="sh-card p-6">
      {/* Icon row */}
      <div className="flex items-center justify-between mb-5">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: c.bg }}
        >
          {icon}
        </div>

        {live && (
          <div style={{ position: "relative", width: "8px", height: "8px" }}>
            <span
              className="live-dot"
              style={{
                display: "block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: c.accent,
              }}
            />
          </div>
        )}
      </div>

      {/* Value */}
      <div
        className="sh-value mb-2"
        style={{
          fontSize: "2.6rem",
          color: live ? c.text : "var(--text-3)",
          transition: "color 0.5s ease",
        }}
      >
        {value ?? "—"}
        {live && (
          <span
            style={{
              fontSize: "1rem",
              fontWeight: 400,
              color: "var(--text-2)",
              marginLeft: "0.3rem",
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="sh-label">{label}</p>
    </div>
  );
}
