import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  CheckSquare,
  Target,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useDebtStore } from "../../store/useDebtStore";
import { useTodoStore } from "../../store/useTodoStore";
import { useGoalStore } from "../../store/useGoalStore";
import { formatDateMini, daysUntil } from "../../utils/formatDate";

interface DeadlineItem {
  id: string;
  title: string;
  dueDate: string;
  type: "debt" | "todo" | "goal";
  daysLeft: number;
}

const TYPE_META = {
  debt: {
    icon: <CreditCard size={13} />,
    label: "Hutang",
    route: "/debt",
    color: "#ef4444",
  },
  todo: {
    icon: <CheckSquare size={13} />,
    label: "To-Do",
    route: "/todo",
    color: "#6366f1",
  },
  goal: {
    icon: <Target size={13} />,
    label: "Tujuan",
    route: "/goals",
    color: "#f59e0b",
  },
};

export function UpcomingDeadlines() {
  const navigate = useNavigate();
  const debts = useDebtStore((s) => s.items);
  const todos = useTodoStore((s) => s.items);
  const goals = useGoalStore((s) => s.goals);

  const getRemainingAmount = (amount: number, paidAmount: number | undefined) =>
    Math.max(amount - (paidAmount ?? 0), 0);

  const deadlines: DeadlineItem[] = [
    ...debts
      .filter(
        (d) => getRemainingAmount(d.amount, d.paidAmount) > 0 && d.dueDate,
      )
      .map((d) => ({
        id: d.id,
        title: `Hutang ke ${d.personName}`,
        dueDate: d.dueDate!,
        type: "debt" as const,
        daysLeft: daysUntil(d.dueDate!),
      })),
    ...todos
      .filter((t) => !t.isCompleted && t.dueDate)
      .map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate!,
        type: "todo" as const,
        daysLeft: daysUntil(t.dueDate!),
      })),
    ...goals
      .filter((g) => g.status !== "completed" && g.targetDate)
      .map((g) => ({
        id: g.id,
        title: g.title,
        dueDate: g.targetDate!,
        type: "goal" as const,
        daysLeft: daysUntil(g.targetDate!),
      })),
  ]
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 6);

  if (deadlines.length === 0) return null;

  return (
    <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-text-primary">
            Deadline Terdekat
          </h2>
        </div>
        <span className="text-[11px] text-text-muted">
          {deadlines.length} item
        </span>
      </div>

      {/* List */}
      <div className="divide-y divide-border">
        {deadlines.map((item) => {
          const isOverdue = item.daysLeft < 0;
          const isUrgent = item.daysLeft >= 0 && item.daysLeft <= 3;
          const meta = TYPE_META[item.type];

          return (
            <button
              key={item.id}
              onClick={() => navigate(meta.route)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary transition-colors text-left group"
            >
              {/* Type icon */}
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: meta.color + "18",
                  color: meta.color,
                }}
              >
                {meta.icon}
              </span>

              {/* Title */}
              <span className="flex-1 text-sm text-text-primary truncate">
                {item.title}
              </span>

              {/* Days left badge */}
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                style={{
                  backgroundColor: isOverdue
                    ? "#ef444420"
                    : isUrgent
                      ? "#f59e0b20"
                      : "var(--bg-secondary)",
                  color: isOverdue
                    ? "#ef4444"
                    : isUrgent
                      ? "#f59e0b"
                      : "var(--text-muted)",
                }}
              >
                {isOverdue
                  ? `${Math.abs(item.daysLeft)}h lalu`
                  : item.daysLeft === 0
                    ? "Hari ini"
                    : item.daysLeft === 1
                      ? "Besok"
                      : `${item.daysLeft} hari`}
              </span>

              {/* Date */}
              <span className="text-[11px] text-text-muted hidden sm:block flex-shrink-0">
                {formatDateMini(item.dueDate)}
              </span>

              <ArrowRight
                size={12}
                className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
