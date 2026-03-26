"use client";

import { useState, useEffect, useRef } from "react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, RefreshCw, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";
import {
  getRecurringExpenses,
  addRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  currentMonthKey,
  formatMonthKey,
  type RecurringExpense,
} from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/lib/i18n";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CATEGORIES = [
  "Housing", "Utilities", "Insurance", "Subscriptions",
  "Transport", "Health", "Financing", "Mortage", "Other",
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Housing:       { bg: "#60a5fa20", text: "#60a5fa" },
  Utilities:     { bg: "#fbbf2420", text: "#fbbf24" },
  Insurance:     { bg: "#a78bfa20", text: "#a78bfa" },
  Subscriptions: { bg: "#f472b620", text: "#f472b6" },
  Transport:     { bg: "#fb923c20", text: "#fb923c" },
  Health:        { bg: "#4ade8020", text: "#4ade80" },
  Financing:     { bg: "#a3e63520", text: "#a3e635" },
  Mortage:       { bg: "#818cf820", text: "#818cf8" },
  Other:         { bg: "#9ca3af20", text: "#9ca3af" },
};

function getCategoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
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

function RecurringSkeleton() {
  const { t } = useTranslation();
  return (
    <div aria-busy="true" aria-label={t("Caricamento spese ricorrenti...")}>
      <Skeleton className="h-24 w-full mb-8" />
      <Skeleton className="h-4 w-16 mb-3" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[#111318] border border-[#1a1d24] rounded-2xl px-5 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-5 w-20" />
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
// Expense form (inside modal)
// ─────────────────────────────────────────────
interface ExpenseFormProps {
  existing?: RecurringExpense;
  onSave: () => void;
  onClose: () => void;
}

function ExpenseForm({ existing, onSave, onClose }: ExpenseFormProps) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const todayKey = currentMonthKey();
  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(existing?.amount.toString() ?? "");
  const [category, setCategory] = useState(existing?.category ?? CATEGORIES[0]);
  const [startMonth, setStartMonth] = useState(existing?.startMonth ?? todayKey);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t("Name is required.");
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) e.amount = t("Enter a valid amount.");
    if (!startMonth) e.startMonth = t("Start month is required.");
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.name) { nameRef.current?.focus(); return; }
      if (errs.amount) { amountRef.current?.focus(); return; }
      return;
    }
    setIsSubmitting(true);
    if (existing) {
      await updateRecurringExpense(existing.id, {
        name: name.trim(), amount: parseFloat(amount), category, startMonth,
      });
    } else {
      await addRecurringExpense(name.trim(), parseFloat(amount), category, startMonth);
    }
    setIsSubmitting(false);
    onSave();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#111318] -m-6 p-6 rounded-b-2xl" noValidate>

      {/* Name */}
      <div className="space-y-1.5">
        <label htmlFor="rec-name" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
          {t("Name")} <span className="text-[#00FFA3]" aria-hidden="true">*</span>
        </label>
        <input
          ref={nameRef}
          id="rec-name" type="text" value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
          placeholder={t("e.g. Netflix, Rent, Car Insurance")}
          aria-required="true"
          aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={errors.name ? "rec-name-error" : undefined}
          autoFocus
          className="block w-full px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl 
                     placeholder-[#6b7280] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3]"
        />
        {errors.name && <p id="rec-name-error" role="alert" className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label htmlFor="rec-amount" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
          {t("Monthly Amount (€)")} <span className="text-[#00FFA3]" aria-hidden="true">*</span>
        </label>
        <input
          ref={amountRef}
          id="rec-amount" type="number" min="0" value={amount}
          onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: "" })); }}
          placeholder="0.00"
          aria-required="true"
          aria-invalid={errors.amount ? "true" : undefined}
          aria-describedby={errors.amount ? "rec-amount-error" : undefined}
          className="block w-full px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl 
                     placeholder-[#6b7280] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] 
                     [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {errors.amount && <p id="rec-amount-error" role="alert" className="text-[11px] text-red-400 mt-1">{errors.amount}</p>}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label htmlFor="rec-category" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
          {t("Category")}
        </label>
        <select
          id="rec-category" value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="block w-full px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl 
                     transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] cursor-pointer appearance-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-[#1a1d24]">{t(c)}</option>
          ))}
        </select>
      </div>

      {/* Start month */}
      <div className="space-y-1.5">
        <label htmlFor="rec-start" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
          {t("Start Month")} <span className="text-[#00FFA3]" aria-hidden="true">*</span>
        </label>
        <input
          id="rec-start" 
          type="month" 
          value={startMonth}
          onChange={(e) => { setStartMonth(e.target.value); setErrors((p) => ({ ...p, startMonth: "" })); }}
          aria-required="true"
          aria-invalid={errors.startMonth ? "true" : undefined}
          aria-describedby={errors.startMonth ? "rec-start-error" : undefined}
          className="block w-full min-w-0 px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl 
                     transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] cursor-pointer capitalize 
                     [&::-webkit-calendar-picker-indicator]:invert [appearance:none] [&::-webkit-date-and-time-value]:text-left [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0"
        />
        {errors.startMonth && <p id="rec-start-error" role="alert" className="text-[11px] text-red-400 mt-1">{errors.startMonth}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit" disabled={isSubmitting} aria-busy={isSubmitting}
          className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#00FFA3] hover:bg-[#00ffb3] active:scale-[0.98] text-[#0d0d0d] 
                     transition-all cursor-pointer disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#1a1d24]"
        >
          {existing ? t("Update") : t("Add Expense")}
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
// Expense row — shared by all sections
// ─────────────────────────────────────────────
interface ExpenseRowProps {
  expense: RecurringExpense;
  locale: string;
  paused?: boolean;
  upcoming?: boolean;
  onToggle: (e: RecurringExpense) => void;
  onEdit: (e: RecurringExpense) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

function ExpenseRow({ expense, locale, paused, upcoming, onToggle, onEdit, onDelete, t }: ExpenseRowProps) {
  const style = getCategoryStyle(expense.category);

  return (
    <div
      className={`border rounded-2xl px-5 py-4 flex items-center justify-between gap-4 transition-opacity ${
        paused
          ? "bg-[#0d0d0d] border-[#1a1d24] opacity-50"
          : upcoming
          ? "bg-[#818cf808] border-[#818cf830]"
          : "bg-[#111318] border-[#1a1d24]"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* P1: toggle button with aria-label and aria-pressed */}
        {!upcoming && (
          <button
            onClick={() => onToggle(expense)}
            aria-label={paused ? `${t("Enable")} ${expense.name}` : `${t("Disable")} ${expense.name}`}
            aria-pressed={!paused}
            className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3] rounded-lg transition-colors cursor-pointer"
          >
            {paused
              ? <ToggleLeft size={22} className="text-[#4b5563] hover:text-[#00FFA3] transition-colors" aria-hidden="true" />
              : <ToggleRight size={22} className="text-[#00FFA3] hover:text-[#00ffb3] transition-colors" aria-hidden="true" />
            }
          </button>
        )}
        <div className="min-w-0">
          <p className={`font-medium truncate ${paused ? "text-[#6b7280] line-through" : "text-[#e5e7eb]"}`}>
            {expense.name}
          </p>
          <span
            className="inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1"
            style={{ backgroundColor: paused ? "#1a1d24" : style.bg, color: paused ? "#6b7280" : style.text }}
          >
            {t(expense.category)}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`font-semibold tabular-nums text-sm ${paused ? "text-[#4b5563]" : "text-[#e5e7eb]"}`}>
          {formatCurrency(expense.amount)}
          <span className="text-xs text-[#6b7280] font-normal ml-0.5">{t("/mo")}</span>
        </span>
        <span className="text-[10px] text-[#6b7280]">
          {upcoming ? t("Starts:") : t("Started:")} {formatMonthKey(expense.startMonth, locale)}
        </span>
        {/* P2: 36×36 action buttons */}
        <div className="flex items-center gap-1 mt-1">
          <button
            onClick={() => onEdit(expense)}
            aria-label={`${t("Edit")} ${expense.name}`}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#6b7280] hover:text-[#00FFA3] hover:bg-[#00FFA320] active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button
            onClick={() => onDelete(expense.id)}
            aria-label={`${t("Delete")} ${expense.name}`}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────
function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <h2 className={`text-xs font-bold tracking-widest uppercase ${color}`}>{label}</h2>
      <span className="text-xs font-bold text-[#657182] tabular-nums">{t("Number of entries")}: {count}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function RecurringPage() {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const reduceMotion = useReducedMotion() ?? false;

  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | undefined>();
  const [refresh, setRefresh] = useState(0);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // P3: cancel flag
  useEffect(() => {
    let cancelled = false;
    
    async function load() {
      const data = await getRecurringExpenses();
      data.sort((a, b) => a.name.localeCompare(b.name));
      if (!cancelled) {
        setExpenses(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refresh]);

  async function handleDelete(id: string) {
    await deleteRecurringExpense(id);
    setConfirmId(null);
    setRefresh((r) => r + 1);
  }

  async function handleToggle(expense: RecurringExpense) {
    await updateRecurringExpense(expense.id, { active: !expense.active });
    setRefresh((r) => r + 1);
  }

  function openEdit(expense: RecurringExpense) {
    setEditing(expense);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(undefined);
  }

  const currentKey = currentMonthKey();
  const activeExpenses   = expenses.filter((e) =>  e.active && e.startMonth <= currentKey);
  const pausedExpenses   = expenses.filter((e) => !e.active && e.startMonth <= currentKey);
  const upcomingExpenses = expenses.filter((e) => e.startMonth > currentKey);
  const totalActive = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  const rowProps = { locale, onToggle: handleToggle, onEdit: openEdit, onDelete: setConfirmId, t };

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-3xl w-full mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t("Recurring Expenses")}</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">{t("Bills, subscriptions, and fixed costs")}</p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#00FFA3] hover:bg-[#00ffb3] active:scale-[0.98] text-[#0d0d0d] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
          aria-label={t("Add Recurring Expense")}
        >
          <Plus size={16} aria-hidden="true" />
          {t("Add Expense")}
        </button>
      </div>

      {/* P3: skeleton */}
      {loading ? (
        <RecurringSkeleton />
      ) : (
        <>
          {/* Summary card */}
          <div className="bg-[#111318] border border-[#1a1d24] rounded-2xl p-5 mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0" aria-hidden="true">
              <RefreshCw size={22} className="text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-[#9ca3af]">{t("Total monthly recurring")}</p>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-orange-400">
                {formatCurrency(totalActive)}
              </p>
              <p className="text-xs text-[#4b5563] mt-0.5">
                {activeExpenses.length} {t(activeExpenses.length === 1 ? "active expense" : "active expenses")}
              </p>
            </div>
          </div>

          {/* Empty state */}
          {expenses.length === 0 && (
            <div className="text-center py-16">
              <RefreshCw size={40} className="mx-auto mb-3 text-[#252830]" aria-hidden="true" />
              <p className="font-semibold text-[#9ca3af]">{t("No recurring expenses yet")}</p>
              <p className="text-sm text-[#6b7280] mt-1">{t("Add your bills, subscriptions, and fixed costs")}</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 flex items-center gap-2 mx-auto px-4 py-2.5 rounded-xl text-sm font-bold bg-[#00FFA3] hover:bg-[#00ffb3] active:scale-[0.98] text-[#0d0d0d] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
              >
                <Plus size={16} aria-hidden="true" />
                {t("Add First Expense")}
              </button>
            </div>
          )}

          {/* Active */}
          {activeExpenses.length > 0 && (
            <section aria-labelledby="section-active" className="mb-6">
              <SectionHeader label={t("Active")} count={activeExpenses.length} color="text-[#00FFA3]" />
              <div className="space-y-2">
                {activeExpenses.map((e) => (
                  <ExpenseRow key={e.id} expense={e} {...rowProps} />
                ))}
              </div>
            </section>
          )}

          {/* Paused */}
          {pausedExpenses.length > 0 && (
            <section aria-labelledby="section-paused" className="mb-6">
              <SectionHeader label={t("Paused")} count={pausedExpenses.length} color="text-[#6b7280]" />
              <div className="space-y-2">
                {pausedExpenses.map((e) => (
                  <ExpenseRow key={e.id} expense={e} {...rowProps} paused />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcomingExpenses.length > 0 && (
            <section aria-labelledby="section-upcoming" className="mb-6">
              <SectionHeader label={t("Upcoming")} count={upcomingExpenses.length} color="text-[#818cf8]" />
              <div className="space-y-2">
                {upcomingExpenses.map((e) => (
                  <ExpenseRow key={e.id} expense={e} {...rowProps} upcoming />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmId && (
          <ConfirmDialog
            message={t("This recurring expense will be permanently deleted. This action cannot be undone.")}
            onConfirm={() => handleDelete(confirmId)}
            onCancel={() => setConfirmId(null)}
            reduceMotion={reduceMotion}
          />
        )}
      </AnimatePresence>

      {/* Modal */}
      {showModal && (
        <Modal
          title={editing ? t("Edit Recurring Expense") : t("Add Recurring Expense")}
          onClose={closeModal}
        >
          <ExpenseForm
            existing={editing}
            onSave={() => setRefresh((r) => r + 1)}
            onClose={closeModal}
          />
        </Modal>
      )}
    </div>
  );
}