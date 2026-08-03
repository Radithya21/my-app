import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Edit2,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Briefcase,
  DollarSign,
  Heart,
  BookOpen,
  User,
  Tag,
  Calendar,
  MoreHorizontal,
  Flame,
} from "lucide-react";
import { AILabel } from "../ui/AILabel";
import { StepList } from "./StepList";
import { GoalProgressChat } from "../goal/GoalProgressChat";
import type { Goal, GoalStatus, GoalStep } from "../../types";
import { formatDateShort, daysUntil } from "../../utils/formatDate";

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORY_META: Record<
  Goal["category"],
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  career: {
    label: "Karier",
    icon: <Briefcase size={13} />,
    color: "#6366f1",
    bg: "#6366f115",
  },
  finance: {
    label: "Keuangan",
    icon: <DollarSign size={13} />,
    color: "#22c55e",
    bg: "#22c55e15",
  },
  health: {
    label: "Kesehatan",
    icon: <Heart size={13} />,
    color: "#ef4444",
    bg: "#ef444415",
  },
  education: {
    label: "Pendidikan",
    icon: <BookOpen size={13} />,
    color: "#f59e0b",
    bg: "#f59e0b15",
  },
  personal: {
    label: "Pribadi",
    icon: <User size={13} />,
    color: "#8b5cf6",
    bg: "#8b5cf615",
  },
  other: {
    label: "Lainnya",
    icon: <Tag size={13} />,
    color: "#94a3b8",
    bg: "#94a3b815",
  },
};

const STATUS_META: Record<
  GoalStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  not_started: {
    label: "Belum Mulai",
    color: "#94a3b8",
    bg: "#94a3b810",
    dot: "#94a3b8",
  },
  in_progress: {
    label: "Berjalan",
    color: "#3b82f6",
    bg: "#3b82f610",
    dot: "#3b82f6",
  },
  completed: {
    label: "Selesai",
    color: "#22c55e",
    bg: "#22c55e10",
    dot: "#22c55e",
  },
  paused: {
    label: "Ditunda",
    color: "#f59e0b",
    bg: "#f59e0b10",
    dot: "#f59e0b",
  },
};

const PRIORITY_META: Record<
  Goal["priority"],
  { label: string; color: string }
> = {
  high: { label: "Tinggi", color: "#ef4444" },
  medium: { label: "Sedang", color: "#f97316" },
  low: { label: "Rendah", color: "#94a3b8" },
};

// ── Circular progress ring ────────────────────────────────────────────────────
function ProgressRing({
  progress,
  color,
  size = 44,
}: {
  progress: number;
  color: string;
  size?: number;
}) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color + "25"}
        strokeWidth={4}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}

// ── GoalCard ──────────────────────────────────────────────────────────────────
interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: GoalStatus) => void;
  onToggleStep: (goalId: string, stepId: string) => void;
  onDeleteStep: (goalId: string, stepId: string) => void;
  onAddStep: (goalId: string, title: string, targetDate?: string) => void;
  onReorderSteps: (goalId: string, activeId: string, overId: string) => void;
}

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  onSetStatus,
  onToggleStep,
  onDeleteStep,
  onAddStep,
  onReorderSteps,
}: GoalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"steps" | "chat">("steps");
  const [showActions, setShowActions] = useState(false);

  const completedSteps = goal.steps.filter(
    (s: GoalStep) => s.isCompleted,
  ).length;
  const totalSteps = goal.steps.length;
  const progress =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const daysLeft = goal.targetDate ? daysUntil(goal.targetDate) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  const catMeta = CATEGORY_META[goal.category];
  const statusMeta = STATUS_META[goal.status];
  const priMeta = PRIORITY_META[goal.priority];

  return (
    <div
      className={[
        "bg-bg-card border rounded-2xl overflow-hidden transition-shadow hover:shadow-md",
        goal.status === "completed" ? "border-green-500/30" : "border-border",
      ].join(" ")}
    >
      {/* ── Top accent bar (color = category) ── */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${catMeta.color}, ${catMeta.color}50)`,
        }}
      />

      {/* ── Main content ── */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Left: progress ring */}
          <div
            className="relative shrink-0 flex items-center justify-center"
            style={{ width: 44, height: 44 }}
          >
            <ProgressRing
              progress={progress}
              color={totalSteps > 0 ? catMeta.color : statusMeta.color}
            />
            <span
              className="absolute text-[10px] font-bold"
              style={{
                color: totalSteps > 0 ? catMeta.color : statusMeta.color,
              }}
            >
              {totalSteps > 0 ? `${progress}%` : "—"}
            </span>
          </div>

          {/* Middle: title + meta */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start gap-1.5">
              <h3
                className={[
                  "font-semibold text-sm leading-tight",
                  goal.status === "completed"
                    ? "line-through text-text-muted"
                    : "text-text-primary",
                ].join(" ")}
              >
                {goal.title}
              </h3>
              {goal.aiCoached && <AILabel />}
            </div>

            {/* Description */}
            {goal.description && (
              <p className="text-xs text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                {goal.description}
              </p>
            )}

            {/* Chips row */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {/* Status */}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: statusMeta.bg,
                  color: statusMeta.color,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: statusMeta.dot }}
                />
                {statusMeta.label}
              </span>

              {/* Category */}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{ backgroundColor: catMeta.bg, color: catMeta.color }}
              >
                {catMeta.icon}
                {catMeta.label}
              </span>

              {/* Priority */}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: priMeta.color + "15",
                  color: priMeta.color,
                }}
              >
                {goal.priority === "high" && <Flame size={10} />}
                {priMeta.label}
              </span>
            </div>

            {/* Date + steps summary */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {goal.targetDate && (
                <span
                  className={[
                    "inline-flex items-center gap-1 text-[11px]",
                    isOverdue
                      ? "text-red-500"
                      : isUrgent
                        ? "text-amber-500"
                        : "text-text-muted",
                  ].join(" ")}
                >
                  <Calendar size={10} />
                  {formatDateShort(goal.targetDate)}
                  {daysLeft !== null && (
                    <span>
                      (
                      {daysLeft < 0
                        ? `${Math.abs(daysLeft)}h lalu`
                        : daysLeft === 0
                          ? "hari ini"
                          : `${daysLeft}h lagi`}
                      )
                    </span>
                  )}
                </span>
              )}
              {totalSteps > 0 && (
                <span className="text-[11px] text-text-muted">
                  {completedSteps}/{totalSteps} langkah
                </span>
              )}
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors"
              aria-label="Lihat detail"
            >
              <ChevronDown
                size={14}
                className={[
                  "transition-transform duration-200",
                  expanded ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors"
                aria-label="Opsi lainnya"
              >
                <MoreHorizontal size={14} />
              </button>
              <AnimatePresence>
                {showActions && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowActions(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-8 z-20 bg-bg-card border border-border rounded-xl shadow-xl py-1 min-w-[140px]"
                    >
                      <button
                        onClick={() => {
                          onEdit(goal);
                          setShowActions(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-secondary transition-colors"
                      >
                        <Edit2 size={12} /> Edit tujuan
                      </button>
                      <div className="h-px bg-border mx-2 my-1" />
                      <button
                        onClick={() => {
                          onDelete(goal.id);
                          setShowActions(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      >
                        <Trash2 size={12} /> Hapus tujuan
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Status action buttons ── */}
        {goal.status !== "completed" && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
            {goal.status === "not_started" && (
              <button
                onClick={() => onSetStatus(goal.id, "in_progress")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                <Play size={10} /> Mulai Sekarang
              </button>
            )}
            {goal.status === "in_progress" && (
              <>
                <button
                  onClick={() => onSetStatus(goal.id, "paused")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-bg-secondary text-text-secondary rounded-lg hover:bg-border transition-colors"
                >
                  <Pause size={10} /> Tunda
                </button>
                <button
                  onClick={() => onSetStatus(goal.id, "completed")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <CheckCircle size={10} /> Tandai Selesai
                </button>
              </>
            )}
            {goal.status === "paused" && (
              <button
                onClick={() => onSetStatus(goal.id, "in_progress")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                <Play size={10} /> Lanjutkan
              </button>
            )}
          </div>
        )}
        {goal.status === "completed" && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-500/20 text-xs text-green-500">
            <CheckCircle size={13} />
            <span className="font-medium">Tujuan ini telah selesai 🎉</span>
            <button
              onClick={() => onSetStatus(goal.id, "in_progress")}
              className="ml-auto text-text-muted hover:text-text-primary transition-colors"
            >
              Buka kembali
            </button>
          </div>
        )}
      </div>

      {/* ── Expanded detail (steps + chat) ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {/* Tab bar */}
              <div className="flex px-4 pt-2 gap-1">
                {(["steps", "chat"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={[
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                      activeTab === tab
                        ? "bg-bg-secondary text-text-primary"
                        : "text-text-muted hover:text-text-primary",
                    ].join(" ")}
                  >
                    {tab === "steps"
                      ? `Langkah${totalSteps > 0 ? ` (${totalSteps})` : ""}`
                      : "Chat ✦"}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="px-4 pb-4 pt-2">
                {activeTab === "steps" ? (
                  <StepList
                    goalId={goal.id}
                    steps={goal.steps}
                    onToggle={onToggleStep}
                    onDelete={onDeleteStep}
                    onAdd={onAddStep}
                    onReorder={onReorderSteps}
                  />
                ) : (
                  <GoalProgressChat goal={goal} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
