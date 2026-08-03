import { forwardRef, useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Tag,
  BookOpen,
  Trophy,
  Briefcase,
  Code,
  Layers,
  Heart,
  Music,
  CheckSquare,
  ArrowRight,
  MoreHorizontal,
  Play,
  Pause,
  Archive,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useKesibukanStore } from "../store/useKesibukanStore";
import { useTodoStore } from "../store/useTodoStore";
import { useNavigate } from "react-router-dom";
import type { Kesibukan, KesibukanStatus } from "../types";

const COLOR_PRESETS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#10b981", label: "Emerald" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#ef4444", label: "Red" },
  { value: "#14b8a6", label: "Teal" },
];

const ICON_OPTIONS = [
  { value: "book", label: "Kuliah", icon: BookOpen },
  { value: "trophy", label: "Lomba", icon: Trophy },
  { value: "briefcase", label: "Magang/Kerja", icon: Briefcase },
  { value: "code", label: "Proyek", icon: Code },
  { value: "heart", label: "Personal", icon: Heart },
  { value: "music", label: "Hobi", icon: Music },
  { value: "tag", label: "Lainnya", icon: Tag },
];

function getIconComponent(iconName?: string) {
  return ICON_OPTIONS.find((o) => o.value === iconName)?.icon ?? Tag;
}

interface KesibukanFormData {
  name: string;
  description: string;
  colorLabel: string;
  icon: string;
  status: KesibukanStatus;
}

function KesibukanFormModal({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<Kesibukan>;
  onSubmit: (data: KesibukanFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<KesibukanFormData>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    colorLabel: initial?.colorLabel ?? "#6366f1",
    icon: initial?.icon ?? "tag",
    status: initial?.status ?? "aktif",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nama kesibukan wajib diisi");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-text-primary mb-1">
          Nama Kesibukan
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="misal: Kuliah, Lomba, Magang..."
          className="w-full h-9 px-3 rounded-lg border border-border bg-bg-primary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-primary mb-1">
          Deskripsi (opsional)
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Keterangan singkat..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-primary mb-2">
          Ikon
        </label>
        <div className="grid grid-cols-4 gap-2">
          {ICON_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, icon: opt.value })}
                className={[
                  "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all",
                  form.icon === opt.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-text-muted hover:border-accent/50",
                ].join(" ")}
              >
                <Icon size={16} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-primary mb-2">
          Warna Label
        </label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setForm({ ...form, colorLabel: c.value })}
              style={{ backgroundColor: c.value }}
              className={[
                "w-7 h-7 rounded-full transition-all",
                form.colorLabel === c.value
                  ? "ring-2 ring-offset-2 ring-offset-bg-primary ring-current scale-110"
                  : "hover:scale-110",
              ].join(" ")}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">
          {initial?.id ? "Simpan Perubahan" : "Tambah Kesibukan"}
        </Button>
      </div>
    </form>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({
  items,
  todos,
}: {
  items: Kesibukan[];
  todos: ReturnType<typeof useTodoStore.getState>["items"];
}) {
  const total = items.length;
  const aktif = items.filter((k) => k.status === "aktif").length;
  const ditunda = items.filter((k) => k.status === "ditunda").length;
  const selesai = items.filter((k) => k.status === "selesai").length;
  const totalTodo = todos.filter(
    (t) => !t.isCompleted && items.some((k) => k.id === t.kesibukanId),
  ).length;

  if (total === 0) return null;

  const stats = [
    { label: "Total", value: total, color: "#6366f1", bg: "#6366f115" },
    { label: "Aktif", value: aktif, color: "#22c55e", bg: "#22c55e15" },
    { label: "Ditunda", value: ditunda, color: "#f59e0b", bg: "#f59e0b15" },
    { label: "Selesai", value: selesai, color: "#94a3b8", bg: "#94a3b815" },
    { label: "To-Do", value: totalTodo, color: "#3b82f6", bg: "#3b82f615" },
  ];

  return (
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
  );
}

// ── Kesibukan Card ────────────────────────────────────────────────────────────
const KesibukanCard = forwardRef<
  HTMLDivElement,
  {
    k: Kesibukan;
    todoCount: number;
    completedCount: number;
    onEdit: (k: Kesibukan) => void;
    onDelete: (id: string) => void;
    onSetStatus: (id: string, status: KesibukanStatus) => void;
    onNavigate: (id: string) => void;
  }
>(function KesibukanCard(
  { k, todoCount, completedCount, onEdit, onDelete, onSetStatus, onNavigate },
  ref
) {
  const [showMenu, setShowMenu] = useState(false);
  const IconComp = getIconComponent(k.icon);
  const total = todoCount + completedCount;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${k.colorLabel}, ${k.colorLabel}50)`,
        }}
      />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: k.colorLabel + "20",
                color: k.colorLabel,
              }}
            >
              <IconComp size={19} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-text-primary text-sm leading-tight truncate">
                {k.name}
              </h3>
              {k.description && (
                <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                  {k.description}
                </p>
              )}
            </div>
          </div>

          {/* Menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-8 z-20 bg-bg-card border border-border rounded-xl shadow-xl py-1 min-w-[160px]"
                  >
                    <button
                      onClick={() => {
                        onEdit(k);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-secondary transition-colors"
                    >
                      <Edit2 size={12} /> Edit kesibukan
                    </button>
                    {k.status === "aktif" && (
                      <button
                        onClick={() => {
                          onSetStatus(k.id, "ditunda");
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-secondary transition-colors"
                      >
                        <Pause size={12} /> Tunda
                      </button>
                    )}
                    {k.status === "ditunda" && (
                      <button
                        onClick={() => {
                          onSetStatus(k.id, "aktif");
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-secondary transition-colors"
                      >
                        <Play size={12} /> Aktifkan kembali
                      </button>
                    )}
                    {k.status !== "selesai" && (
                      <button
                        onClick={() => {
                          onSetStatus(k.id, "selesai");
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-secondary transition-colors"
                      >
                        <Archive size={12} /> Arsipkan
                      </button>
                    )}
                    {k.status === "selesai" && (
                      <button
                        onClick={() => {
                          onSetStatus(k.id, "aktif");
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-secondary transition-colors"
                      >
                        <Play size={12} /> Aktifkan kembali
                      </button>
                    )}
                    <div className="h-px bg-border mx-2 my-1" />
                    <button
                      onClick={() => {
                        onDelete(k.id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[11px] text-text-muted">
              <span>
                {completedCount}/{total} to-do selesai
              </span>
              <span className="font-medium" style={{ color: k.colorLabel }}>
                {progress}%
              </span>
            </div>
            <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: k.colorLabel }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between mt-3">
          {/* Status pill */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{
              backgroundColor: k.colorLabel + "15",
              color: k.colorLabel,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: k.colorLabel }}
            />
            {k.status === "aktif"
              ? "Aktif"
              : k.status === "ditunda"
                ? "Ditunda"
                : "Selesai"}
          </span>

          {/* Go to todos */}
          <button
            onClick={() => onNavigate(k.id)}
            className="inline-flex items-center gap-1 text-[11px] font-medium transition-colors hover:opacity-80"
            style={{ color: k.colorLabel }}
          >
            {todoCount > 0 ? `${todoCount} pending` : "Lihat to-do"}
            <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { items, add, update, remove, setStatus } = useKesibukanStore();
  const todos = useTodoStore((s) => s.items);
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Kesibukan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = (data: KesibukanFormData) => {
    add(data);
    toast.success("Kesibukan ditambahkan");
    setShowForm(false);
  };
  const handleEdit = (data: KesibukanFormData) => {
    if (!editItem) return;
    update(editItem.id, data);
    toast.success("Kesibukan diperbarui");
    setEditItem(null);
  };
  const handleDelete = (id: string) => {
    remove(id);
    toast.success("Kesibukan dihapus");
    setDeleteId(null);
  };

  const getTodoCounts = (kId: string) => ({
    pending: todos.filter((t) => t.kesibukanId === kId && !t.isCompleted)
      .length,
    completed: todos.filter((t) => t.kesibukanId === kId && t.isCompleted)
      .length,
  });

  const activeItems = items.filter((k) => k.status === "aktif");
  const pausedItems = items.filter((k) => k.status === "ditunda");
  const archivedItems = items.filter((k) => k.status === "selesai");

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Kesibukan</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Kategori utama untuk to-do dan aktivitasmu
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Tambah Kesibukan
        </Button>
      </div>

      {/* ── Stats ── */}
      <StatsBar items={items} todos={todos} />

      {/* ── How it works ── */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-secondary flex items-center justify-center mb-4">
            <Layers size={28} className="text-text-muted" />
          </div>
          <p className="font-semibold text-text-primary mb-1">
            Belum ada kesibukan
          </p>
          <p className="text-sm text-text-muted mb-4 max-w-xs">
            Tambah kesibukan seperti "Kuliah", "Lomba", atau "Magang" sebagai
            kategori to-do kamu.
          </p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={13} /> Tambah Pertama
          </Button>
        </div>
      )}

      {/* ── Flow hint (only shown when has items) ── */}
      {items.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap text-xs text-text-muted bg-bg-secondary rounded-xl px-4 py-2.5">
          <span className="flex items-center gap-1.5 font-medium text-text-secondary">
            <Layers size={13} className="text-accent" /> Tambah Kesibukan
          </span>
          <ArrowRight size={11} className="text-text-muted shrink-0" />
          <span className="flex items-center gap-1.5 font-medium text-text-secondary">
            <CheckSquare size={13} className="text-accent" /> Isi To-Do per
            Kesibukan
          </span>
          <ArrowRight size={11} className="text-text-muted shrink-0" />
          <span className="flex items-center gap-1.5 font-medium text-text-secondary">
            <Archive size={13} className="text-accent" /> Arsipkan jika selesai
          </span>
          <button
            className="ml-auto text-accent font-medium hover:underline shrink-0"
            onClick={() => navigate("/todo")}
          >
            Buka To-Do →
          </button>
        </div>
      )}

      {/* ── Active ── */}
      {activeItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Aktif · {activeItems.length}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {activeItems.map((k) => {
                const { pending, completed } = getTodoCounts(k.id);
                return (
                  <KesibukanCard
                    key={k.id}
                    k={k}
                    todoCount={pending}
                    completedCount={completed}
                    onEdit={setEditItem}
                    onDelete={(id) => setDeleteId(id)}
                    onSetStatus={setStatus}
                    onNavigate={(id) => navigate(`/todo?kesibukan=${id}`)}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ── Paused ── */}
      {pausedItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Ditunda · {pausedItems.length}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 opacity-75">
            <AnimatePresence mode="popLayout">
              {pausedItems.map((k) => {
                const { pending, completed } = getTodoCounts(k.id);
                return (
                  <KesibukanCard
                    key={k.id}
                    k={k}
                    todoCount={pending}
                    completedCount={completed}
                    onEdit={setEditItem}
                    onDelete={(id) => setDeleteId(id)}
                    onSetStatus={setStatus}
                    onNavigate={(id) => navigate(`/todo?kesibukan=${id}`)}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ── Archived ── */}
      {archivedItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
            Arsip · {archivedItems.length}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 opacity-50">
            <AnimatePresence mode="popLayout">
              {archivedItems.map((k) => {
                const { pending, completed } = getTodoCounts(k.id);
                return (
                  <KesibukanCard
                    key={k.id}
                    k={k}
                    todoCount={pending}
                    completedCount={completed}
                    onEdit={setEditItem}
                    onDelete={(id) => setDeleteId(id)}
                    onSetStatus={setStatus}
                    onNavigate={(id) => navigate(`/todo?kesibukan=${id}`)}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ── Modals ── */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Tambah Kesibukan Baru"
      >
        <KesibukanFormModal
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title="Edit Kesibukan"
      >
        {editItem && (
          <KesibukanFormModal
            initial={editItem}
            onSubmit={handleEdit}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>
      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        title="Hapus Kesibukan?"
        message="Yakin ingin menghapus kesibukan ini? To-do yang terhubung tidak akan ikut terhapus."
      />
    </div>
  );
}
