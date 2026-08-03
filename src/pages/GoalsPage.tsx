import { useState } from "react";
import {
  Plus,
  Target,
  Flame,
  CheckCircle2,
  Clock,
  PauseCircle,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { GoalCard } from "../components/goals/GoalCard";
import { GoalForm } from "../components/goals/GoalForm";
import { GoalCoachModal } from "../components/ai/GoalCoachModal";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useGoalStore } from "../store/useGoalStore";
import { useUIStore } from "../store/useUIStore";
import type { Goal, GoalStatus } from "../types";

type FilterType = "all" | GoalStatus;

const FILTERS: {
  key: FilterType;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    key: "all",
    label: "Semua",
    icon: <Target size={13} />,
    color: "text-text-secondary",
  },
  {
    key: "in_progress",
    label: "Berjalan",
    icon: <Flame size={13} />,
    color: "text-blue-500",
  },
  {
    key: "not_started",
    label: "Belum Mulai",
    icon: <Clock size={13} />,
    color: "text-text-muted",
  },
  {
    key: "completed",
    label: "Selesai",
    icon: <CheckCircle2 size={13} />,
    color: "text-green-500",
  },
  {
    key: "paused",
    label: "Ditunda",
    icon: <PauseCircle size={13} />,
    color: "text-amber-500",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  career: "#6366f1",
  finance: "#22c55e",
  health: "#ef4444",
  education: "#f59e0b",
  personal: "#8b5cf6",
  other: "#94a3b8",
};

const CATEGORY_LABELS: Record<string, string> = {
  career: "Karier",
  finance: "Keuangan",
  health: "Kesehatan",
  education: "Pendidikan",
  personal: "Pribadi",
  other: "Lainnya",
};

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) return null;

  const total = goals.length;
  const inProgress = goals.filter((g) => g.status === "in_progress").length;
  const completed = goals.filter((g) => g.status === "completed").length;
  const notStarted = goals.filter((g) => g.status === "not_started").length;
  const paused = goals.filter((g) => g.status === "paused").length;

  // Average progress across goals that have steps
  const withSteps = goals.filter((g) => g.steps.length > 0);
  const avgProgress =
    withSteps.length > 0
      ? Math.round(
          withSteps.reduce((sum, g) => {
            const done = g.steps.filter((s) => s.isCompleted).length;
            return sum + (done / g.steps.length) * 100;
          }, 0) / withSteps.length,
        )
      : 0;

  const stats = [
    { label: "Total", value: total, color: "#6366f1", bg: "#6366f115" },
    { label: "Berjalan", value: inProgress, color: "#3b82f6", bg: "#3b82f615" },
    { label: "Selesai", value: completed, color: "#22c55e", bg: "#22c55e15" },
    { label: "Belum", value: notStarted, color: "#94a3b8", bg: "#94a3b815" },
    { label: "Ditunda", value: paused, color: "#f59e0b", bg: "#f59e0b15" },
  ];

  return (
    <div className="space-y-3">
      {/* Stat chips */}
      <div className="grid grid-cols-5 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center justify-center rounded-xl py-2.5 px-1"
            style={{ backgroundColor: s.bg }}
          >
            <span
              className="text-lg font-bold leading-none"
              style={{ color: s.color }}
            >
              {s.value}
            </span>
            <span className="text-[10px] text-text-muted mt-1 leading-none">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      {withSteps.length > 0 && (
        <div className="bg-bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4">
          <TrendingUp size={16} className="text-accent shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs text-text-muted mb-1.5">
              <span>Progress rata-rata</span>
              <span className="font-semibold text-text-primary">
                {avgProgress}%
              </span>
            </div>
            <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${avgProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Category breakdown — mini colored dots */}
      {goals.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const count = goals.filter((g) => g.category === key).length;
            if (count === 0) return null;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border"
                style={{
                  borderColor: CATEGORY_COLORS[key] + "50",
                  color: CATEGORY_COLORS[key],
                  backgroundColor: CATEGORY_COLORS[key] + "12",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[key] }}
                />
                {label} · {count}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GoalsPage() {
  const {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    setGoalStatus,
    addStep,
    deleteStep,
    toggleStep,
    reorderSteps,
  } = useGoalStore();

  const [filter, setFilter] = useState<FilterType>("all");
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [coachGoal, setCoachGoal] = useState<Goal | null>(null);
  const [showCoach, setShowCoach] = useState(false);

  const filtered = goals.filter((g) => filter === "all" || g.status === filter);

  // Sort: in_progress first, then by priority, then by targetDate
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  const STATUS_ORDER: Record<GoalStatus, number> = {
    in_progress: 0,
    not_started: 1,
    paused: 2,
    completed: 3,
  };
  const sorted = [...filtered].sort((a, b) => {
    const sd = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (sd !== 0) return sd;
    const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pd !== 0) return pd;
    if (a.targetDate && b.targetDate)
      return a.targetDate.localeCompare(b.targetDate);
    return 0;
  });

  const handleAdd = (
    data: Omit<Goal, "id" | "steps" | "createdAt" | "updatedAt" | "status">,
  ) => {
    addGoal({ ...data, status: "not_started" });
    toast.success("Tujuan ditambahkan!");
    setShowForm(false);
    const apiKey = useUIStore.getState().getGroqApiKey();
    if (apiKey) {
      const latest = useGoalStore.getState().goals.at(-1);
      if (latest) {
        setCoachGoal(latest);
        setShowCoach(true);
      }
    }
  };

  const handleEdit = (
    data: Omit<Goal, "id" | "steps" | "createdAt" | "updatedAt" | "status">,
  ) => {
    if (!editGoal) return;
    updateGoal(editGoal.id, data);
    toast.success("Tujuan diperbarui");
    setEditGoal(null);
  };

  const handleDelete = (id: string) => {
    deleteGoal(id);
    toast.success("Tujuan dihapus");
    setDeleteId(null);
  };

  const handleAddStep = (
    goalId: string,
    title: string,
    targetDate?: string,
  ) => {
    addStep(goalId, {
      title,
      isCompleted: false,
      targetDate,
      description: undefined,
      completedAt: undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Tujuan</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Petakan dan capai impianmu selangkah demi selangkah
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          Tambah
        </Button>
      </div>

      {/* ── Stats ── */}
      <StatsBar goals={goals} />

      {/* ── Filter chips ── */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(({ key, label, icon, color }) => {
          const count =
            key === "all"
              ? goals.length
              : goals.filter((g) => g.status === key).length;
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                active
                  ? "bg-accent text-white shadow-sm"
                  : "bg-bg-secondary text-text-secondary hover:bg-border",
              ].join(" ")}
            >
              <span className={active ? "text-white" : color}>{icon}</span>
              {label}
              {count > 0 && (
                <span
                  className={[
                    "inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-border text-text-muted",
                  ].join(" ")}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Goal list ── */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sorted.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-bg-secondary flex items-center justify-center mb-4">
                <Target size={28} className="text-text-muted" />
              </div>
              <p className="font-semibold text-text-primary mb-1">
                {filter === "all"
                  ? "Belum ada tujuan"
                  : `Tidak ada tujuan "${FILTERS.find((f) => f.key === filter)?.label}"`}
              </p>
              <p className="text-sm text-text-muted mb-4 max-w-xs">
                {filter === "all"
                  ? "Impian tanpa rencana hanyalah angan. Tulis tujuan pertamamu!"
                  : "Coba lihat kategori lain atau tambah tujuan baru."}
              </p>
              {filter === "all" && (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <Plus size={13} /> Buat Tujuan Pertama
                </Button>
              )}
            </motion.div>
          ) : (
            sorted.map((goal, i) => (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18, delay: i * 0.03 }}
              >
                <GoalCard
                  goal={goal}
                  onEdit={setEditGoal}
                  onDelete={(id) => setDeleteId(id)}
                  onSetStatus={setGoalStatus}
                  onToggleStep={toggleStep}
                  onDeleteStep={deleteStep}
                  onAddStep={handleAddStep}
                  onReorderSteps={reorderSteps}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Modals ── */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Tambah Tujuan"
      >
        <GoalForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal
        isOpen={!!editGoal}
        onClose={() => setEditGoal(null)}
        title="Edit Tujuan"
      >
        {editGoal && (
          <GoalForm
            initialData={editGoal}
            onSubmit={handleEdit}
            onCancel={() => setEditGoal(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        title="Hapus Tujuan?"
        message="Semua langkah dalam tujuan ini juga akan dihapus. Tindakan ini tidak bisa dibatalkan."
      />

      <GoalCoachModal
        isOpen={showCoach}
        goal={coachGoal}
        onClose={() => {
          setShowCoach(false);
          setCoachGoal(null);
        }}
        onDone={() => {
          setShowCoach(false);
          setCoachGoal(null);
        }}
      />
    </div>
  );
}
