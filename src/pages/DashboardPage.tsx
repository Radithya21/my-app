import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  CheckSquare,
  Target,
  Plus,
  ArrowRight,
  Flame,
  Sun,
  Briefcase,
  Clock,
} from "lucide-react";
import { DailyDigest } from "../components/ai/DailyDigest";
import { AIOnboardingBanner } from "../components/ai/AIOnboardingBanner";
import { SummaryCard } from "../components/dashboard/SummaryCard";
import { UpcomingDeadlines } from "../components/dashboard/UpcomingDeadlines";
import { useDebtStore } from "../store/useDebtStore";
import { useTodoStore } from "../store/useTodoStore";
import { useGoalStore } from "../store/useGoalStore";
import { useScheduleStore } from "../store/useScheduleStore";
import { useKesibukanStore } from "../store/useKesibukanStore";
import { formatCurrency } from "../utils/formatCurrency";
import { toISODate } from "../utils/formatDate";
import type { DigestContext } from "../types";

// Quick actions config
const QUICK_ACTIONS = [
  {
    label: "Tugas Baru",
    to: "/todo",
    icon: <CheckSquare size={15} />,
    color: "#6366f1",
    bg: "#6366f115",
  },
  {
    label: "Tujuan Baru",
    to: "/goals",
    icon: <Target size={15} />,
    color: "#f59e0b",
    bg: "#f59e0b15",
  },
  {
    label: "Catat Hutang",
    to: "/debt",
    icon: <CreditCard size={15} />,
    color: "#ef4444",
    bg: "#ef444415",
  },
  {
    label: "Kesibukan",
    to: "/schedule",
    icon: <Briefcase size={15} />,
    color: "#22c55e",
    bg: "#22c55e15",
  },
];

// Today's activities helper
function getTodayActivities(
  activities: ReturnType<typeof useScheduleStore.getState>["activities"],
  today: string,
) {
  const dayOfWeek = new Date().getDay();
  const dayOfMonth = new Date().getDate();
  return activities.filter((a) => {
    if (!a.isActive) return false;
    if (a.recurrence === "daily") return true;
    if (a.recurrence === "once") return a.date === today;
    if (a.recurrence === "weekly")
      return a.dayOfWeek?.includes(dayOfWeek) ?? false;
    if (a.recurrence === "monthly") return a.dayOfMonth === dayOfMonth;
    return false;
  });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const debts = useDebtStore((s) => s.items);
  const todos = useTodoStore((s) => s.items);
  const goals = useGoalStore((s) => s.goals);
  const activities = useScheduleStore((s) => s.activities);
  const kesibukan = useKesibukanStore((s) => s.items);

  const today = toISODate(new Date());
  const todayActivities = getTodayActivities(activities, today);

  const getRemainingAmount = (amount: number, paidAmount: number | undefined) =>
    Math.max(amount - (paidAmount ?? 0), 0);

  // Debt
  const unpaidDebts = debts.filter(
    (d) => d.type === "owe" && getRemainingAmount(d.amount, d.paidAmount) > 0,
  );
  const totalDebt = unpaidDebts.reduce(
    (s, d) => s + getRemainingAmount(d.amount, d.paidAmount),
    0,
  );

  // Todos
  const pendingTodos = todos.filter((t) => !t.isCompleted);
  const todayTodos = todos.filter((t) => !t.isCompleted && t.dueDate === today);
  const todayDone = todos.filter((t) => t.isCompleted && t.dueDate === today);
  const todayProgress =
    todayTodos.length + todayDone.length > 0
      ? Math.round(
          (todayDone.length / (todayTodos.length + todayDone.length)) * 100,
        )
      : 0;
  const urgentTodos = pendingTodos.filter((t) => t.priority === "urgent");

  // Goals
  const activeGoals = goals.filter(
    (g) => g.status === "in_progress" || g.status === "not_started",
  );
  const inProgressGoals = goals.filter((g) => g.status === "in_progress");
  const avgGoalProgress = (() => {
    const withSteps = goals.filter((g) => g.steps.length > 0);
    if (!withSteps.length) return 0;
    return Math.round(
      withSteps.reduce((sum, g) => {
        const done = g.steps.filter((s) => s.isCompleted).length;
        return sum + (done / g.steps.length) * 100;
      }, 0) / withSteps.length,
    );
  })();

  // Kesibukan aktif
  const activeKesibukan = kesibukan.filter((k) => k.status === "aktif");

  // DigestContext
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const threeDaysStr = toISODate(threeDaysLater);

  const digestContext: DigestContext = {
    date: today,
    todayActivities,
    pendingDebts: unpaidDebts
      .map((d) => ({
        ...d,
        amount: getRemainingAmount(d.amount, d.paidAmount),
      }))
      .slice(0, 5),
    nearDueTodos: pendingTodos
      .filter((t) => t.dueDate && t.dueDate <= threeDaysStr)
      .slice(0, 5),
    urgentTodos: urgentTodos.slice(0, 5),
    activeGoals,
  };

  // Animation variants
  const fadeUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      {/* ── Greeting + AI Digest ── */}
      <motion.div {...fadeUp} transition={{ duration: 0.2 }}>
        <DailyDigest context={digestContext} />
      </motion.div>

      {/* ── AI onboarding ── */}
      <AIOnboardingBanner />

      {/* ── Focus Today (only shown when relevant) ── */}
      {(todayTodos.length > 0 ||
        urgentTodos.length > 0 ||
        todayActivities.length > 0) && (
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-bg-card border border-border rounded-2xl overflow-hidden"
        >
          {/* Section header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sun size={14} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-text-primary">
                Fokus Hari Ini
              </h2>
            </div>
            <button
              onClick={() => navigate("/todo?filter=today")}
              className="text-[11px] text-accent hover:underline flex items-center gap-0.5"
            >
              Lihat semua <ArrowRight size={10} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* Today's todo progress */}
            {todayTodos.length + todayDone.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare size={12} />
                    Tugas hari ini
                  </span>
                  <span className="font-semibold text-text-primary">
                    {todayDone.length}/{todayTodos.length + todayDone.length} ·{" "}
                    {todayProgress}%
                  </span>
                </div>
                <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #f59e0b, #f97316)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${todayProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Urgent todos */}
            {urgentTodos.length > 0 && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-500/8 border border-red-500/20">
                <Flame
                  size={13}
                  className="text-red-500 mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-red-500 mb-1">
                    {urgentTodos.length} tugas mendesak
                  </p>
                  <div className="space-y-0.5">
                    {urgentTodos.slice(0, 3).map((t) => (
                      <p
                        key={t.id}
                        className="text-xs text-text-secondary truncate"
                      >
                        · {t.title}
                      </p>
                    ))}
                    {urgentTodos.length > 3 && (
                      <p className="text-xs text-text-muted">
                        +{urgentTodos.length - 3} lainnya
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate("/todo")}
                  className="text-[11px] text-red-500 hover:underline flex-shrink-0"
                >
                  Lihat →
                </button>
              </div>
            )}

            {/* Today's activities */}
            {todayActivities.length > 0 && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-500/8 border border-blue-500/20">
                <Clock
                  size={13}
                  className="text-blue-500 mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-500 mb-1">
                    {todayActivities.length} aktivitas hari ini
                  </p>
                  <div className="space-y-0.5">
                    {todayActivities.slice(0, 2).map((a) => (
                      <p
                        key={a.id}
                        className="text-xs text-text-secondary truncate"
                      >
                        · {a.title}
                      </p>
                    ))}
                    {todayActivities.length > 2 && (
                      <p className="text-xs text-text-muted">
                        +{todayActivities.length - 2} lainnya
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Summary cards ── */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.2, delay: 0.08 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <SummaryCard
          label="To-Do Pending"
          value={pendingTodos.length}
          icon={<CheckSquare size={16} />}
          color={
            pendingTodos.length > 5
              ? "warning"
              : pendingTodos.length === 0
                ? "success"
                : "default"
          }
          subtitle={`${todayTodos.length} untuk hari ini`}
          onClick={() => navigate("/todo")}
          progress={todayProgress}
        />
        <SummaryCard
          label="Tujuan Aktif"
          value={inProgressGoals.length}
          icon={<Target size={16} />}
          color="warning"
          subtitle={`${avgGoalProgress}% avg progress`}
          onClick={() => navigate("/goals")}
          progress={avgGoalProgress}
        />
        <SummaryCard
          label="Total Hutang"
          value={totalDebt > 0 ? formatCurrency(totalDebt) : "—"}
          icon={<CreditCard size={16} />}
          color={totalDebt > 0 ? "danger" : "success"}
          subtitle={
            totalDebt > 0
              ? `${unpaidDebts.length} belum lunas`
              : "Semua lunas ✓"
          }
          onClick={() => navigate("/debt")}
        />
        <SummaryCard
          label="Kesibukan Aktif"
          value={activeKesibukan.length}
          icon={<Briefcase size={16} />}
          color="accent"
          subtitle={`${todayActivities.length} aktivitas hari ini`}
          onClick={() => navigate("/schedule")}
        />
      </motion.div>

      {/* ── Upcoming deadlines ── */}
      <motion.div {...fadeUp} transition={{ duration: 0.2, delay: 0.12 }}>
        <UpcomingDeadlines />
      </motion.div>

      {/* ── Quick actions ── */}
      <motion.div {...fadeUp} transition={{ duration: 0.2, delay: 0.15 }}>
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
          <Plus size={12} /> Aksi Cepat
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="flex items-center gap-2.5 p-3 bg-bg-card border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:shadow-sm transition-all active:scale-[0.98] group"
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                style={{ backgroundColor: action.bg, color: action.color }}
              >
                {action.icon}
              </span>
              <span className="font-medium text-xs">{action.label}</span>
              <ArrowRight
                size={12}
                className="ml-auto text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
