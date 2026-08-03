import { useState } from "react";
import { Plus, Search, TrendingDown, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { DebtCard } from "../components/debt/DebtCard";
import { DebtForm } from "../components/debt/DebtForm";
import { DebtSummary } from "../components/debt/DebtSummary";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { useDebtStore } from "../store/useDebtStore";
import type { DebtItem } from "../types";

type TabType = "owe" | "lend";
type FilterType = "all" | "unpaid" | "paid";
type SortType = "newest" | "oldest" | "largest" | "due";

export default function DebtPage() {
  const { items, addItem, addPayment, updateItem, deleteItem, markUnpaid } =
    useDebtStore();
  const [activeTab, setActiveTab] = useState<TabType>("owe");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<DebtItem | null>(null);

  const getRemainingAmount = (item: DebtItem) =>
    Math.max(item.amount - (item.paidAmount ?? 0), 0);

  const tabItems = items.filter((i) => i.type === activeTab);

  const filtered = tabItems
    .filter((i) => {
      const rem = getRemainingAmount(i);
      if (filter === "unpaid") return rem > 0;
      if (filter === "paid") return rem <= 0;
      return true;
    })
    .filter((i) => i.personName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "newest")
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      if (sort === "oldest")
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      if (sort === "largest")
        return getRemainingAmount(b) - getRemainingAmount(a);
      if (sort === "due") {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      return 0;
    });

  const handleAdd = (
    data: Omit<
      DebtItem,
      | "id"
      | "isPaid"
      | "paidAmount"
      | "payments"
      | "paidDate"
      | "createdAt"
      | "updatedAt"
    >,
  ) => {
    addItem({ ...data, isPaid: false, paidAmount: 0, payments: [] });
    toast.success("Catatan ditambahkan");
    setShowForm(false);
  };

  const handleEdit = (
    data: Omit<
      DebtItem,
      | "id"
      | "isPaid"
      | "paidAmount"
      | "payments"
      | "paidDate"
      | "createdAt"
      | "updatedAt"
    >,
  ) => {
    if (!editItem) return;
    updateItem(editItem.id, data);
    toast.success("Catatan diperbarui");
    setEditItem(null);
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
    toast.success("Catatan dihapus");
  };

  const handleAddPayment = (
    id: string,
    amount: number,
    paymentDate: string,
    note?: string,
  ) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    const remaining = getRemainingAmount(current);
    const applied = Math.min(Math.max(0, amount), remaining);
    if (applied <= 0) return;
    addPayment(id, amount, paymentDate, note);
    if (applied >= remaining)
      toast.success("Pembayaran dicatat. Hutang sudah lunas! 🎉");
    else
      toast.success(
        `Cicilan Rp ${applied.toLocaleString("id-ID")} berhasil dicatat.`,
      );
  };

  // Stats for tabs
  const oweItems = items.filter((i) => i.type === "owe");
  const lendItems = items.filter((i) => i.type === "lend");
  const oweUnpaid = oweItems.filter((i) => getRemainingAmount(i) > 0).length;
  const lendUnpaid = lendItems.filter((i) => getRemainingAmount(i) > 0).length;

  // Filter counts
  const allCount = tabItems.length;
  const unpaidCount = tabItems.filter((i) => getRemainingAmount(i) > 0).length;
  const paidCount = tabItems.filter((i) => getRemainingAmount(i) <= 0).length;

  const FILTERS: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "Semua", count: allCount },
    { key: "unpaid", label: "Belum Lunas", count: unpaidCount },
    { key: "paid", label: "Lunas", count: paidCount },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            Hutang & Piutang
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Catat dan lacak semua tagihan dengan rapi
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Tambah
        </Button>
      </div>

      {/* ── Summary chart ── */}
      <DebtSummary />

      {/* ── Tab: Hutang vs Piutang ── */}
      <div className="flex gap-2">
        {(
          [
            {
              key: "owe",
              label: "Hutang Saya",
              icon: <TrendingDown size={14} />,
              color: "#ef4444",
              unpaid: oweUnpaid,
            },
            {
              key: "lend",
              label: "Piutang",
              icon: <TrendingUp size={14} />,
              color: "#22c55e",
              unpaid: lendUnpaid,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all",
              activeTab === tab.key
                ? "bg-bg-card border-2 shadow-sm"
                : "bg-bg-secondary text-text-muted hover:text-text-secondary border-2 border-transparent",
            ].join(" ")}
            style={
              activeTab === tab.key
                ? { borderColor: tab.color, color: tab.color }
                : {}
            }
          >
            {tab.icon}
            {tab.label}
            {tab.unpaid > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={
                  activeTab === tab.key
                    ? { backgroundColor: tab.color + "20", color: tab.color }
                    : {
                        backgroundColor: "var(--bg-card)",
                        color: "var(--text-muted)",
                      }
                }
              >
                {tab.unpaid}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search + Sort ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm bg-bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-text-muted text-text-primary transition"
            placeholder="Cari nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortType)}
          className="px-3 py-2 text-sm bg-bg-card border border-border rounded-xl text-text-secondary outline-none cursor-pointer"
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="largest">Terbesar</option>
          <option value="due">Jatuh Tempo</option>
        </select>
      </div>

      {/* ── Filter chips ── */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(({ key, label, count }) => (
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
            {label}
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
          </button>
        ))}
      </div>

      {/* ── List ── */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-bg-secondary flex items-center justify-center mb-4">
                {activeTab === "owe" ? (
                  <TrendingDown size={28} className="text-text-muted" />
                ) : (
                  <TrendingUp size={28} className="text-text-muted" />
                )}
              </div>
              <p className="font-semibold text-text-primary mb-1">
                {filter === "paid"
                  ? "Belum ada yang lunas"
                  : filter === "unpaid"
                    ? "Semua sudah lunas! 🎉"
                    : activeTab === "owe"
                      ? "Tidak ada hutang"
                      : "Tidak ada piutang"}
              </p>
              <p className="text-sm text-text-muted mb-4 max-w-xs">
                {filter !== "all"
                  ? "Coba filter lain."
                  : activeTab === "owe"
                    ? "Semoga keuangan selalu sehat! 💪"
                    : "Belum ada yang berhutang ke kamu."}
              </p>
              {filter === "all" && (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <Plus size={13} /> Tambah Catatan
                </Button>
              )}
            </motion.div>
          ) : (
            filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <DebtCard
                  item={item}
                  onEdit={setEditItem}
                  onDelete={handleDelete}
                  onAddPayment={handleAddPayment}
                  onMarkUnpaid={markUnpaid}
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
        title="Tambah Catatan Hutang"
      >
        <DebtForm
          defaultType={activeTab}
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title="Edit Catatan Hutang"
      >
        {editItem && (
          <DebtForm
            initialData={editItem}
            onSubmit={handleEdit}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>
    </div>
  );
}
