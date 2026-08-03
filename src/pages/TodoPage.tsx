import { useState, useMemo, useEffect } from "react";
import { addDays, startOfDay, endOfWeek, isAfter } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  CheckSquare,
  Trash2,
  GitBranch,
  List,
  Plus,
  Flame,
  Sun,
  Clock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { QuickAdd } from "../components/todo/QuickAdd";
import { TodoItemComponent } from "../components/todo/TodoItemComponent";
import { TodoForm } from "../components/todo/TodoForm";
import { MindMapView } from "../components/todo/MindMapView";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { useTodoStore } from "../store/useTodoStore";
import { useKesibukanStore } from "../store/useKesibukanStore";
import { useLocalDate } from "../hooks/useLocalDate";
import type { TodoItem, TodoGroup } from "../types";
import { toISODate } from "../utils/formatDate";

type FilterType = "all" | "today" | "urgent" | string;

const GROUP_META: Record<
  TodoGroup,
  { label: string; icon: React.ReactNode; color: string }
> = {
  today: { label: "Hari Ini", icon: <Sun size={13} />, color: "#f59e0b" },
  tomorrow: { label: "Besok", icon: <Clock size={13} />, color: "#6366f1" },
  this_week: {
    label: "Minggu Ini",
    icon: <TrendingUp size={13} />,
    color: "#3b82f6",
  },
  later: { label: "Nanti", icon: <Clock size={13} />, color: "#94a3b8" },
  done: {
    label: "Selesai",
    icon: <CheckCircle2 size={13} />,
    color: "#22c55e",
  },
};

function groupTodos(
  items: TodoItem[],
  now: Date,
): Record<TodoGroup, TodoItem[]> {
  const today = toISODate(now);
  const tomorrow = toISODate(addDays(now, 1));
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const groups: Record<TodoGroup, TodoItem[]> = {
    today: [],
    tomorrow: [],
    this_week: [],
    later: [],
    done: [],
  };

  for (const item of items) {
    if (item.isCompleted) {
      groups.done.push(item);
      continue;
    }
    if (!item.dueDate) {
      groups.later.push(item);
      continue;
    }
    if (item.dueDate <= today) groups.today.push(item);
    else if (item.dueDate === tomorrow) groups.tomorrow.push(item);
    else if (
      !isAfter(startOfDay(new Date(item.dueDate + "T00:00:00")), weekEnd)
    )
      groups.this_week.push(item);
    else groups.later.push(item);
  }

  for (const key of ["today", "tomorrow", "this_week", "later"] as const) {
    groups[key].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const ORDER = ["urgent", "high", "medium", "low"];
      return ORDER.indexOf(a.priority) - ORDER.indexOf(b.priority);
    });
  }

  return groups;
}

type ViewMode = "list" | "mindmap";

// ── Daily stats bar ───────────────────────────────────────────────────────────
function DailyStats({ items, today }: { items: TodoItem[]; today: string }) {
  const todayItems = items.filter((i) => i.dueDate === today);
  const todayDone = todayItems.filter((i) => i.isCompleted).length;
  const todayPending = todayItems.filter((i) => !i.isCompleted).length;
  const urgent = items.filter(
    (i) => !i.isCompleted && i.priority === "urgent",
  ).length;
  const totalPending = items.filter((i) => !i.isCompleted).length;
  const totalCompleted = items.filter((i) => i.isCompleted).length;

  if (items.length === 0) return null;

  const todayProgress =
    todayItems.length > 0
      ? Math.round((todayDone / todayItems.length) * 100)
      : 0;

  const stats = [
    {
      label: "Pending",
      value: totalPending,
      color: "#6366f1",
      bg: "#6366f115",
    },
    {
      label: "Hari Ini",
      value: todayPending,
      color: "#f59e0b",
      bg: "#f59e0b15",
    },
    { label: "Mendesak", value: urgent, color: "#ef4444", bg: "#ef444415" },
    {
      label: "Selesai",
      value: totalCompleted,
      color: "#22c55e",
      bg: "#22c55e15",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
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

      {todayItems.length > 0 && (
        <div className="bg-bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4">
          <Sun size={15} className="text-amber-500 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs text-text-muted mb-1.5">
              <span>Progress hari ini</span>
              <span className="font-semibold text-text-primary">
                {todayDone}/{todayItems.length} tugas · {todayProgress}%
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
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TodoPage() {
  const {
    items,
    addItem,
    updateItem,
    deleteItem,
    toggleComplete,
    togglePin,
    clearCompleted,
    markTodayAsDone,
  } = useTodoStore();
  const kesibukanItems = useKesibukanStore((s) =>
    s.items.filter((k) => k.status === "aktif"),
  );
  const now = useLocalDate();
  const today = toISODate(now);
  const [searchParams] = useSearchParams();

  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<TodoItem | null>(null);

  const urlKesibukanId = searchParams.get("kesibukan");
  useEffect(() => {
    if (urlKesibukanId) setFilter(urlKesibukanId);
  }, [urlKesibukanId]);

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "today")
      return items.filter((i) => !i.isCompleted && i.dueDate === today);
    if (filter === "urgent")
      return items.filter((i) => !i.isCompleted && i.priority === "urgent");
    const k = kesibukanItems.find((k) => k.id === filter);
    if (k) return items.filter((i) => i.kesibukanId === filter);
    return items.filter((i) => i.category === filter);
  }, [items, filter, today, kesibukanItems]);

  const grouped = useMemo(
    () => groupTodos(filteredItems, now),
    [filteredItems, now],
  );
  const categories = [
    ...new Set(items.map((i) => i.category).filter(Boolean)),
  ] as string[];
  const completedCount = items.filter((i) => i.isCompleted).length;
  const activeFilter = kesibukanItems.find((k) => k.id === filter);

  const handleQuickAdd = (title: string, dueDate: string) => {
    const kId = kesibukanItems.find((k) => k.id === filter)?.id;
    addItem({ title, priority: "medium", dueDate, kesibukanId: kId });
    toast.success("Tugas ditambahkan");
  };

  const handleAdd = (
    data: Omit<
      TodoItem,
      "id" | "isCompleted" | "completedAt" | "createdAt" | "updatedAt"
    >,
  ) => {
    addItem(data);
    toast.success("Tugas ditambahkan");
    setShowForm(false);
  };

  const handleEdit = (
    data: Omit<
      TodoItem,
      "id" | "isCompleted" | "completedAt" | "createdAt" | "updatedAt"
    >,
  ) => {
    if (!editItem) return;
    updateItem(editItem.id, data);
    toast.success("Tugas diperbarui");
    setEditItem(null);
  };

  const orderGroups: TodoGroup[] = [
    "today",
    "tomorrow",
    "this_week",
    "later",
    "done",
  ];
  const pendingCount = items.filter((i) => !i.isCompleted).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            To-Do
            {pendingCount > 0 && (
              <span className="ml-2 text-sm font-normal text-text-muted">
                {pendingCount} pending
              </span>
            )}
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Kelola tugas harianmu dengan efisien
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* View toggle */}
          <div className="flex gap-0.5 p-1 bg-bg-secondary rounded-lg">
            <button
              onClick={() => setViewMode("list")}
              title="List view"
              className={[
                "p-1.5 rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-bg-card shadow-sm text-text-primary"
                  : "text-text-muted hover:text-text-secondary",
              ].join(" ")}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode("mindmap")}
              title="Mind Map view"
              className={[
                "p-1.5 rounded-md transition-colors",
                viewMode === "mindmap"
                  ? "bg-bg-card shadow-sm text-text-primary"
                  : "text-text-muted hover:text-text-secondary",
              ].join(" ")}
            >
              <GitBranch size={14} />
            </button>
          </div>
          {completedCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                clearCompleted();
                toast.success("Tugas selesai dihapus");
              }}
            >
              <Trash2 size={12} /> Hapus selesai ({completedCount})
            </Button>
          )}
        </div>
      </div>

      {/* ── Daily stats ── */}
      <DailyStats items={items} today={today} />

      {/* ── Quick add ── */}
      <QuickAdd onAdd={handleQuickAdd} onOpenFull={() => setShowForm(true)} />

      {/* ── Filter chips ── */}
      <div className="flex gap-1.5 flex-wrap">
        {/* Base filters */}
        {(
          [
            { key: "all", label: "Semua", icon: null, count: items.length },
            {
              key: "today",
              label: "Hari Ini",
              icon: <Sun size={12} />,
              count: items.filter((i) => !i.isCompleted && i.dueDate === today)
                .length,
            },
            {
              key: "urgent",
              label: "Mendesak",
              icon: <Flame size={12} />,
              count: items.filter(
                (i) => !i.isCompleted && i.priority === "urgent",
              ).length,
            },
          ] as {
            key: FilterType;
            label: string;
            icon: React.ReactNode;
            count: number;
          }[]
        ).map(({ key, label, icon, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              filter === key
                ? "bg-accent text-white shadow-sm"
                : "bg-bg-secondary text-text-secondary hover:bg-border",
            ].join(" ")}
          >
            {icon && (
              <span
                className={filter === key ? "text-white" : "text-text-muted"}
              >
                {icon}
              </span>
            )}
            {label}
            {count > 0 && (
              <span
                className={[
                  "inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold",
                  filter === key
                    ? "bg-white/20 text-white"
                    : "bg-border text-text-muted",
                ].join(" ")}
              >
                {count}
              </span>
            )}
          </button>
        ))}

        {/* Kesibukan divider */}
        {kesibukanItems.length > 0 && (
          <div className="w-px h-6 bg-border self-center mx-0.5" />
        )}

        {/* Kesibukan chips */}
        {kesibukanItems.map((k) => {
          const count = items.filter(
            (i) => i.kesibukanId === k.id && !i.isCompleted,
          ).length;
          const active = filter === k.id;
          return (
            <button
              key={k.id}
              onClick={() => setFilter(active ? "all" : k.id)}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                active
                  ? "text-white shadow-sm"
                  : "bg-bg-secondary text-text-secondary hover:bg-border",
              ].join(" ")}
              style={active ? { backgroundColor: k.colorLabel } : {}}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: active
                    ? "rgba(255,255,255,0.8)"
                    : k.colorLabel,
                }}
              />
              {k.name}
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

        {/* Category tags */}
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={[
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filter === cat
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-border",
            ].join(" ")}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Active kesibukan banner ── */}
      {activeFilter && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
          style={{
            backgroundColor: activeFilter.colorLabel + "15",
            color: activeFilter.colorLabel,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: activeFilter.colorLabel }}
          />
          Menampilkan to-do dari: <strong>{activeFilter.name}</strong>
          <button
            className="ml-auto text-[10px] underline opacity-70 hover:opacity-100"
            onClick={() => setFilter("all")}
          >
            Hapus filter
          </button>
        </div>
      )}

      {/* ── Mark today done ── */}
      {filter === "today" &&
        items.filter((i) => !i.isCompleted && i.dueDate === today).length >
          0 && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              markTodayAsDone();
              toast.success("Semua tugas hari ini selesai!");
            }}
          >
            <CheckSquare size={12} /> Tandai hari ini selesai
          </Button>
        )}

      {/* ── Content ── */}
      {viewMode === "mindmap" ? (
        <div
          className="bg-bg-card border border-border rounded-xl overflow-hidden"
          style={{ minHeight: 520 }}
        >
          <MindMapView
            todos={
              activeFilter
                ? items.filter(
                    (t) => !t.isCompleted && t.kesibukanId === activeFilter.id,
                  )
                : items.filter((t) => !t.isCompleted)
            }
            kesibukan={activeFilter ? [activeFilter] : kesibukanItems}
            onToggle={toggleComplete}
            onEdit={setEditItem}
          />
        </div>
      ) : filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-bg-secondary flex items-center justify-center mb-4">
            <CheckSquare size={28} className="text-text-muted" />
          </div>
          <p className="font-semibold text-text-primary mb-1">
            {filter === "all" ? "Inbox kosong" : "Tidak ada tugas di sini"}
          </p>
          <p className="text-sm text-text-muted mb-4 max-w-xs">
            {filter === "all"
              ? "Nikmati atau mulai rencanakan harimu."
              : "Coba filter lain atau tambah tugas baru."}
          </p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={13} /> Tambah Tugas
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {orderGroups.map((group) => {
            const groupItems = grouped[group];
            if (groupItems.length === 0) return null;
            const meta = GROUP_META[group];
            return (
              <div key={group}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: meta.color }}>{meta.icon}</span>
                  <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    {meta.label}
                  </h2>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-bg-secondary text-text-muted">
                    {groupItems.length}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <AnimatePresence mode="popLayout">
                  {groupItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="mb-2"
                    >
                      <TodoItemComponent
                        item={item}
                        onToggle={toggleComplete}
                        onTogglePin={togglePin}
                        onEdit={setEditItem}
                        onDelete={deleteItem}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Tambah Tugas"
      >
        <TodoForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
          defaultKesibukanId={activeFilter?.id}
        />
      </Modal>
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title="Edit Tugas"
      >
        {editItem && (
          <TodoForm
            initialData={editItem}
            onSubmit={handleEdit}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>
    </div>
  );
}
