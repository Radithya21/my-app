import { useState } from "react";
import {
  Edit2,
  Trash2,
  CheckCircle,
  RotateCcw,
  ChevronDown,
  MoreHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Modal } from "../ui/Modal";
import { Input, Textarea } from "../ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import type { DebtItem } from "../../types";
import {
  formatCurrency,
  formatCurrencyInput,
  parseCurrency,
} from "../../utils/formatCurrency";
import { formatDateShort, daysUntil, toISODate } from "../../utils/formatDate";

interface DebtCardProps {
  item: DebtItem;
  onEdit: (item: DebtItem) => void;
  onDelete: (id: string) => void;
  onAddPayment: (
    id: string,
    amount: number,
    paymentDate: string,
    note?: string,
  ) => void;
  onMarkUnpaid: (id: string) => void;
}

export function DebtCard({
  item,
  onEdit,
  onDelete,
  onAddPayment,
  onMarkUnpaid,
}: DebtCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [paymentDate, setPaymentDate] = useState(toISODate(new Date()));
  const [paymentAmt, setPaymentAmt] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const paidAmount = Math.max(0, Math.min(item.paidAmount ?? 0, item.amount));
  const remainingAmount = Math.max(item.amount - paidAmount, 0);
  const isFullyPaid = item.isPaid || remainingAmount <= 0;
  const progress =
    item.amount > 0 ? Math.round((paidAmount / item.amount) * 100) : 0;

  const daysLeft = item.dueDate ? daysUntil(item.dueDate) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  const accentColor = item.type === "owe" ? "#ef4444" : "#22c55e";

  const openPayment = () => {
    setPaymentDate(toISODate(new Date()));
    setPaymentAmt(formatCurrencyInput(String(remainingAmount)));
    setPaymentNote("");
    setShowPayment(true);
  };

  const handleSubmitPayment = () => {
    const amount = parseCurrency(paymentAmt);
    if (amount <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }
    onAddPayment(item.id, amount, paymentDate, paymentNote);
    setShowPayment(false);
  };

  // Status label + color
  const statusColor = isFullyPaid
    ? "#22c55e"
    : paidAmount > 0
      ? "#f59e0b"
      : "#ef4444";
  const statusLabel = isFullyPaid
    ? "Lunas ✓"
    : paidAmount > 0
      ? "Nyicil"
      : "Belum Lunas";

  return (
    <>
      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden hover:shadow-sm transition-shadow">
        {/* Accent bar */}
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}50)`,
          }}
        />

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: accentColor + "18",
                  color: accentColor,
                }}
              >
                {item.type === "owe" ? (
                  <TrendingDown size={16} />
                ) : (
                  <TrendingUp size={16} />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-text-primary text-sm truncate">
                  {item.personName}
                </p>
                <p className="text-xs text-text-muted truncate mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors"
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
                        className="absolute right-0 top-8 z-20 bg-bg-card border border-border rounded-xl shadow-xl py-1 min-w-[140px]"
                      >
                        <button
                          onClick={() => {
                            onEdit(item);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-bg-secondary transition-colors"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <div className="h-px bg-border mx-2 my-1" />
                        <button
                          onClick={() => {
                            setShowConfirm(true);
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
          </div>

          {/* Amount + status */}
          <div className="flex items-end justify-between gap-2 mt-3">
            <div>
              <p
                className="text-xl font-bold leading-none"
                style={{ color: accentColor }}
              >
                {formatCurrency(isFullyPaid ? item.amount : remainingAmount)}
              </p>
              {!isFullyPaid && paidAmount > 0 && (
                <p className="text-[11px] text-text-muted mt-1">
                  Dari {formatCurrency(item.amount)} · Terbayar{" "}
                  {formatCurrency(paidAmount)}
                </p>
              )}
            </div>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: statusColor + "18",
                color: statusColor,
              }}
            >
              {statusLabel}
            </span>
          </div>

          {/* Progress bar (only if partially paid) */}
          {paidAmount > 0 && !isFullyPaid && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[11px] text-text-muted">
                <span>Progress pelunasan</span>
                <span className="font-medium" style={{ color: accentColor }}>
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: accentColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Date info */}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap text-[11px] text-text-muted">
            <span>{formatDateShort(item.date)}</span>
            {item.dueDate && (
              <span
                className={
                  isOverdue
                    ? "text-red-500 font-medium"
                    : isUrgent
                      ? "text-amber-500 font-medium"
                      : ""
                }
              >
                Jatuh tempo: {formatDateShort(item.dueDate)}
                {daysLeft !== null && !isFullyPaid && (
                  <span className="ml-1">
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
          </div>

          {/* Action button */}
          {!isFullyPaid && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <button
                onClick={openPayment}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors"
                style={{ backgroundColor: accentColor }}
              >
                <CheckCircle size={12} />
                {paidAmount > 0 ? "Cicil / Lunasi" : "Bayar Sekarang"}
              </button>
            </div>
          )}
          {isFullyPaid && (
            <div className="mt-3 pt-3 border-t border-green-500/20 flex items-center justify-between text-xs text-green-500">
              <span className="font-medium flex items-center gap-1">
                <CheckCircle size={12} />
                {item.paidDate
                  ? `Dilunasi ${formatDateShort(item.paidDate)}`
                  : "Sudah Lunas"}
              </span>
              <button
                onClick={() => onMarkUnpaid(item.id)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Expanded detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                {item.notes && (
                  <p className="text-sm text-text-secondary">{item.notes}</p>
                )}
                {(item.payments?.length ?? 0) > 0 && (
                  <div className="rounded-xl border border-border bg-bg-secondary/40 p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">
                      Riwayat Pembayaran
                    </p>
                    {[...(item.payments ?? [])]
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .slice(0, 5)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-xs gap-2"
                        >
                          <span className="font-medium text-text-primary">
                            {formatCurrency(p.amount)}
                          </span>
                          <span className="text-text-muted">
                            {formatDateShort(p.date)}
                            {p.note ? ` · ${p.note}` : ""}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          onDelete(item.id);
          setShowConfirm(false);
        }}
        title="Hapus Catatan?"
        message={`Hapus catatan ${item.personName} (${formatCurrency(remainingAmount)})?`}
      />

      <Modal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        title="Catat Pembayaran"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ backgroundColor: accentColor + "12" }}
          >
            <span className="text-sm text-text-secondary">Sisa tagihan</span>
            <span className="font-bold text-sm" style={{ color: accentColor }}>
              {formatCurrency(remainingAmount)}
            </span>
          </div>
          <Input
            label="Jumlah Pembayaran (Rp)"
            value={paymentAmt}
            onChange={(e) => setPaymentAmt(formatCurrencyInput(e.target.value))}
            inputMode="numeric"
            placeholder="0"
          />
          <button
            type="button"
            onClick={() =>
              setPaymentAmt(formatCurrencyInput(String(remainingAmount)))
            }
            className="text-xs text-accent hover:underline self-start -mt-2"
          >
            Isi nominal pelunasan penuh
          </button>
          <Input
            label="Tanggal Pembayaran"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
          <Textarea
            label="Catatan (opsional)"
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            placeholder="Contoh: transfer BCA"
            rows={2}
          />
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="secondary" onClick={() => setShowPayment(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmitPayment}>Konfirmasi</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
