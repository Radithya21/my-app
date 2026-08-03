import { motion } from "framer-motion";
import { Pin, Edit2, Trash2, Calendar } from "lucide-react";
import type { TodoItem, TodoPriority } from "../../types";
import { formatDateMini, daysUntil } from "../../utils/formatDate";

const PRIORITY_META: Record<
  TodoPriority,
  { label: string; color: string; bg: string; border: string }
> = {
  urgent: {
    label: "Mendesak",
    color: "#ef4444",
    bg: "#ef444415",
    border: "border-l-red-500",
  },
  high: {
    label: "Tinggi",
    color: "#f97316",
    bg: "#f9731615",
    border: "border-l-orange-500",
  },
  medium: {
    label: "Sedang",
    color: "#6366f1",
    bg: "#6366f115",
    border: "border-l-indigo-400",
  },
  low: {
    label: "Rendah",
    color: "#94a3b8",
    bg: "#94a3b815",
    border: "border-l-slate-300",
  },
};

interface TodoItemComponentProps {
  item: TodoItem;
  onToggle: (id: string) => void;
  onTogglePin: (id: string) => void;
  onEdit: (item: TodoItem) => void;
  onDelete: (id: string) => void;
}

export function TodoItemComponent({
  item,
  onToggle,
  onTogglePin,
  onEdit,
  onDelete,
}: TodoItemComponentProps) {
  const daysLeft = item.dueDate ? daysUntil(item.dueDate) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0 && !item.isCompleted;
  const isUrgent =
    daysLeft !== null && daysLeft <= 1 && daysLeft >= 0 && !item.isCompleted;

  const meta = PRIORITY_META[item.priority];

  return (
    <motion.div
      layout
      className={[
        "bg-bg-card border border-border border-l-4 rounded-xl p-3 flex items-start gap-3 group transition-shadow hover:shadow-sm",
        meta.border,
        item.isPinned ? "ring-1 ring-accent/25" : "",
      ].join(" ")}
    >
      {/* Toggle button */}
      <button
        onClick={() => onToggle(item.id)}
        aria-label={item.isCompleted ? "Batalkan" : "Tandai selesai"}
        className={[
          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
          item.isCompleted
            ? "bg-green-500 border-green-500"
            : "border-border hover:border-green-500",
        ].join(" ")}
      >
        {item.isCompleted && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
          >
            <path
              d="M1.5 5L4 7.5L8.5 2.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p
            className={[
              "text-sm leading-snug flex-1 min-w-0 transition-all duration-300",
              item.isCompleted
                ? "line-through text-text-muted"
                : "text-text-primary",
            ].join(" ")}
          >
            {item.title}
          </p>
          {item.isPinned && (
            <Pin size={11} className="text-accent mt-0.5 shrink-0" />
          )}
        </div>

        {item.description && !item.isCompleted && (
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
            {item.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Priority pill */}
          {!item.isCompleted && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{ backgroundColor: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
          )}

          {/* Category */}
          {item.category && (
            <span className="text-[11px] px-1.5 py-0.5 bg-bg-secondary text-text-muted rounded">
              {item.category}
            </span>
          )}

          {/* Due date */}
          {item.dueDate && (
            <span
              className={[
                "inline-flex items-center gap-1 text-[11px]",
                isOverdue
                  ? "text-red-500 font-medium"
                  : isUrgent
                    ? "text-amber-500 font-medium"
                    : "text-text-muted",
              ].join(" ")}
            >
              <Calendar size={10} />
              {formatDateMini(item.dueDate)}
              {item.dueTime && ` ${item.dueTime}`}
              {isOverdue && " · Terlewat"}
              {isUrgent && !isOverdue && " · Segera"}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onTogglePin(item.id)}
          aria-label={item.isPinned ? "Unpin" : "Pin"}
          className={[
            "p-1.5 rounded-lg transition-colors",
            item.isPinned
              ? "text-accent"
              : "text-text-muted hover:text-text-primary hover:bg-bg-secondary",
          ].join(" ")}
        >
          <Pin size={12} />
        </button>
        <button
          onClick={() => onEdit(item)}
          aria-label="Edit"
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          aria-label="Hapus"
          className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}
