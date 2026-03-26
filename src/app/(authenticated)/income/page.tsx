"use client";

import { useState, useEffect, useRef } from "react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, TrendingUp, AlertTriangle } from "lucide-react";
import {
  currentMonthKey,
  formatMonthKey,
  getIncomes,
  upsertIncome,
  deleteIncome,
  type MonthlyIncome,
} from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Modal } from "@/components/ui/Modal";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function addMonths(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency", currency: "EUR", minimumFractionDigits: 2,
  }).format(amount);
}

// ─────────────────────────────────────────────
// P3: Skeleton
// ─────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-[#1a1d24] rounded-xl animate-pulse ${className}`} aria-hidden="true" />;
}

function IncomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Caricamento entrate...">
      {/* Current month card */}
      <div className="bg-[#111318] border border-[#1a1d24] rounded-2xl p-6 mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-9 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      {/* History */}
      <Skeleton className="h-4 w-28 mb-3" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[#111318] border border-[#1a1d24] rounded-xl px-5 py-3.5 flex justify-between items-center">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Accessible confirm dialog
// ─────────────────────────────────────────────
interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  reduceMotion: boolean;
}

function ConfirmDialog({ message, onConfirm, onCancel, reduceMotion }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  // P1: focus trap — focus cancel button on open
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // P1: close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    // P1: role="dialog" with aria-modal
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      role="dialog" 
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={onCancel} 
        aria-hidden="true" 
      />
      <motion.div
        initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
        transition={{ duration: reduceMotion ? 0 : 0.15, ease: "easeOut" as const }}
        className="relative z-10 bg-[#1a1d24] border border-[#252830] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-400" aria-hidden="true" />
          </div>
          <div>
            <p id="confirm-title" className="text-sm font-semibold text-white">
              {t("Confirm Deletion")}
            </p>
            <p id="confirm-desc" className="text-xs text-[#9ca3af] mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* P8: destructive action is visually distinct and NOT the default focus */}
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            {t("Delete")}
          </button>
          {/* P1: cancel is default focus */}
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#252830] text-white hover:bg-[#2e3340] active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
          >
            {t("Cancel")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Income form
// ─────────────────────────────────────────────
interface IncomeFormProps {
  monthKey: string;
  existing?: MonthlyIncome;
  onSave: () => void;
  onClose: () => void;
}

function IncomeForm({ monthKey, existing, onSave, onClose }: IncomeFormProps) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const [amount, setAmount] = useState(existing?.amount.toString() ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // P8: focus amount on error
  const amountRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError(t("Please enter a valid amount greater than 0."));
      amountRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    await upsertIncome(monthKey, parsed, note);
    setIsSubmitting(false);
    onSave();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#111318] -m-6 p-6 rounded-t-2" noValidate>

      {/* Month (read-only) */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
          {t("Month")}
        </p>
        <p className="text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl px-4 py-3 flex items-center">
          {formatMonthKey(monthKey, locale)}
        </p>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label htmlFor="income-amount" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
          {t("Amount")} (€) <span className="text-[#00FFA3]" aria-hidden="true">*</span>
        </label>
        <input
          ref={amountRef}
          id="income-amount"
          type="number" step="0.01" min="0"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          placeholder={t("e.g. 2500.00")}
          aria-required="true"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "income-amount-error" : undefined}
          autoFocus
          className="block w-full px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl 
                     placeholder-[#363a44] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] 
                     [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {error && (
          <p id="income-amount-error" role="alert" className="text-[11px] text-red-400 mt-1">{error}</p>
        )}
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label htmlFor="income-note" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
          {t("Note (optional)")}
        </label>
        <input
          id="income-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("e.g. Salary + bonus")}
          className="block w-full px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl 
                     placeholder-[#6b7280] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3]"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit" disabled={isSubmitting} aria-busy={isSubmitting}
          className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#00FFA3] hover:bg-[#00ffb3] active:scale-[0.98] text-[#0d0d0d] 
                     transition-all cursor-pointer disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#1a1d24]"
        >
          {existing ? t("Update Income") : t("Save Income")}
        </button>
        <button
          type="button" onClick={onClose}
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#252830] hover:bg-[#2e3340] active:scale-[0.98] text-white 
                     transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9ca3af] focus:ring-offset-2 focus:ring-offset-[#1a1d24]"
        >
          {t("Cancel")}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function IncomePage() {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const reduceMotion = useReducedMotion() ?? false;

  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [allIncomes, setAllIncomes] = useState<MonthlyIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // P3: cancel flag
  useEffect(() => {
    let cancelled = false;
    
    async function load() {
      const data = (await getIncomes()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
      if (!cancelled) {
        setAllIncomes(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refresh]);

  const currentIncome = allIncomes.find((i) => i.monthKey === monthKey);

  async function handleDelete(id: string) {
    await deleteIncome(id);
    setConfirmId(null);
    setRefresh((r) => r + 1);
  }

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-3xl w-full mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t("Income")}</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">{t("Record your monthly earnings")}</p>
        </div>
        {/* P2: 44px touch target */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#00FFA3] hover:bg-[#00ffb3] active:scale-[0.98] text-[#0d0d0d] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
          aria-label={t("Set Income")}
        >
          <Plus size={16} aria-hidden="true" />
          {t("Set Income")}
        </button>
      </div>

      {/* Month selector */}
      <div
        className="flex items-center gap-1 bg-[#111318] border border-[#1a1d24] rounded-xl px-2 py-1 w-fit mb-6"
        role="group"
        aria-label={t("Month navigation")}
      >
        <button
          onClick={() => setMonthKey(addMonths(monthKey, -1))}
          aria-label={t("Previous month")}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1a1d24] transition-colors cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span
          className="text-sm font-semibold text-white min-w-[120px] text-center tabular-nums select-none"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatMonthKey(monthKey, locale)}
        </span>
        <button
          onClick={() => setMonthKey(addMonths(monthKey, 1))}
          aria-label={t("Next month")}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1a1d24] transition-colors cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      {/* P3: skeleton */}
      {loading ? (
        <IncomeSkeleton />
      ) : (
        <>
          {/* Current month card */}
          <div className="bg-[#111318] border border-[#1a1d24] rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0" aria-hidden="true">
                <TrendingUp size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-[#9ca3af]">{t("Income for")}</p>
                <p className="font-semibold text-white text-sm">{formatMonthKey(monthKey, locale)}</p>
              </div>
            </div>

            {currentIncome ? (
              <div>
                <p className="text-3xl font-bold tabular-nums tracking-tight text-emerald-400">
                  {formatCurrency(currentIncome.amount)}
                </p>
                {currentIncome.note && (
                  <p className="text-sm text-[#6b7280] mt-1">{currentIncome.note}</p>
                )}
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setShowModal(true)}
                    aria-label={t("Edit income for this month")}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#1a1d24] hover:bg-[#252830] active:scale-[0.98] text-[#9ca3af] hover:text-white transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
                  >
                    <Pencil size={14} aria-hidden="true" />
                    {t("Edit")}
                  </button>
                  <button
                    onClick={() => setConfirmId(currentIncome.id)}
                    aria-label={t("Delete income for this month")}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 active:scale-[0.98] text-red-400 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    {t("Delete")}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-[#6b7280]">{t("No income recorded for this month.")}</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-[#1a1d24] hover:bg-[#252830] active:scale-[0.98] text-[#00FFA3] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
                >
                  <Plus size={14} aria-hidden="true" />
                  {t("Add Income")}
                </button>
              </div>
            )}
          </div>

          {/* History */}
          <section aria-labelledby="income-history-heading">
            <h2 id="income-history-heading" className="text-sm font-semibold text-white mb-3">
              {t("Income History")}
            </h2>

            {allIncomes.length === 0 ? (
              <p className="text-sm text-[#6b7280]">{t("No income entries yet.")}</p>
            ) : (
              <div className="space-y-2">
                {allIncomes.map((income) => (
                  <div
                    key={income.id}
                    className="bg-[#111318] border border-[#1a1d24] rounded-xl px-5 py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#e5e7eb]">
                        {formatMonthKey(income.monthKey, locale)}
                      </p>
                      {income.note && (
                        <p className="text-xs text-[#6b7280] mt-0.5 truncate">{income.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-semibold text-emerald-400 tabular-nums">
                        {formatCurrency(income.amount)}
                      </span>
                      {/* P2: 36×36 touch target */}
                      <button
                        onClick={() => setConfirmId(income.id)}
                        aria-label={`${t("Delete income for")} ${formatMonthKey(income.monthKey, locale)}`}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmId && (
          <ConfirmDialog
            message={t("This income entry will be permanently deleted.")}
            onConfirm={() => handleDelete(confirmId)}
            onCancel={() => setConfirmId(null)}
            reduceMotion={reduceMotion}
          />
        )}
      </AnimatePresence>

      {/* Modal */}
      {showModal && (
        <Modal
          title={currentIncome ? t("Edit Income") : t("Set Income")}
          onClose={() => setShowModal(false)}
        >
          <IncomeForm
            monthKey={monthKey}
            existing={currentIncome}
            onSave={() => setRefresh((r) => r + 1)}
            onClose={() => setShowModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}