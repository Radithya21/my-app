interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "default" | "danger" | "success" | "warning" | "accent";
  subtitle?: string;
  onClick?: () => void;
  progress?: number; // 0–100
}

const COLOR = {
  default: { text: "#6366f1", bg: "bg-bg-secondary", bar: "#6366f1" },
  danger: {
    text: "#ef4444",
    bg: "bg-red-100 dark:bg-red-900/20",
    bar: "#ef4444",
  },
  success: {
    text: "#22c55e",
    bg: "bg-green-100 dark:bg-green-900/20",
    bar: "#22c55e",
  },
  warning: {
    text: "#f59e0b",
    bg: "bg-amber-100 dark:bg-amber-900/20",
    bar: "#f59e0b",
  },
  accent: {
    text: "#3b82f6",
    bg: "bg-blue-100 dark:bg-blue-900/20",
    bar: "#3b82f6",
  },
};

export function SummaryCard({
  label,
  value,
  icon,
  color = "default",
  subtitle,
  onClick,
  progress,
}: SummaryCardProps) {
  const c = COLOR[color];
  const Tag = onClick ? "button" : "div";

  // Use smaller font for long string values (e.g. currency)
  const strVal = String(value);
  const valueCls =
    strVal.length > 6 ? "text-base font-bold" : "text-2xl font-bold";

  return (
    <Tag
      onClick={onClick}
      className={[
        "bg-bg-card border border-border rounded-2xl p-3.5 flex flex-col gap-2.5 transition-all text-left",
        onClick
          ? "cursor-pointer hover:shadow-md active:scale-[0.98] w-full"
          : "",
      ].join(" ")}
    >
      {/* Icon row */}
      <div className="flex items-center justify-between gap-1">
        <div className={["p-2 rounded-xl flex-shrink-0", c.bg].join(" ")}>
          <span style={{ color: c.text }}>{icon}</span>
        </div>
        {/* Value — right aligned, scales down for long strings */}
        <span
          className={[
            valueCls,
            "leading-none text-right min-w-0 break-all",
          ].join(" ")}
          style={{ color: c.text }}
        >
          {value}
        </span>
      </div>

      {/* Label + subtitle */}
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-text-primary leading-tight truncate">
          {label}
        </p>
        {subtitle && (
          <p className="text-[11px] text-text-muted leading-tight truncate">
            {subtitle}
          </p>
        )}
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="h-1 bg-bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              backgroundColor: c.bar,
            }}
          />
        </div>
      )}
    </Tag>
  );
}
