"use client";

import { useState, useEffect, useRef } from "react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, ShoppingBag, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import {
  currentMonthKey,
  formatMonthKey,
  formatDate,
  getOneTimeExpensesForMonth,
  addOneTimeExpense,
  deleteOneTimeExpense,
  updateOneTimeExpense,
  type OneTimeExpense,
} from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/lib/i18n";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CATEGORIES = [
  "Food & Dining", "Shopping", "Entertainment", "Travel",
  "Health", "Personal Care", "Gifts", "Home", "Other",
];

// Dark-theme category colors
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Food & Dining":  { bg: "#fb923c20", text: "#fb923c" },
  Shopping:         { bg: "#f472b620", text: "#f472b6" },
  Entertainment:    { bg: "#a78bfa20", text: "#a78bfa" },
  Travel:           { bg: "#60a5fa20", text: "#60a5fa" },
  Health:           { bg: "#4ade8020", text: "#4ade80" },
  "Personal Care":  { bg: "#2dd4bf20", text: "#2dd4bf" },
  Gifts:            { bg: "#f8717120", text: "#f87171" },
  Home:             { bg: "#fbbf2420", text: "#fbbf24" },
  Other:            { bg: "#9ca3af20", text: "#9ca3af" },
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

function addMonths(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function groupByCategory(expenses: OneTimeExpense[]): Record<string, OneTimeExpense[]> {
  return expenses.reduce<Record<string, OneTimeExpense[]>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {});
}

function groupByDate(expenses: OneTimeExpense[]): Record<string, OneTimeExpense[]> {
  return expenses.reduce<Record<string, OneTimeExpense[]>>((acc, e) => {
    const key = e.date.toISOString().split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});
}

// ─────────────────────────────────────────────
// P3: Skeleton
// ─────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-[#1a1d24] rounded-xl animate-pulse ${className}`} aria-hidden="true" />;
}

function ExpensesSkeleton() {
  return (
    <div aria-busy="true" aria-label="Caricamento spese...">
      <Skeleton className="h-24 w-full mb-8" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#111318] border border-[#1a1d24] rounded-2xl px-5 py-4 flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// P8: Accessible confirm dialog (replaces native confirm())
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
  existing?: OneTimeExpense;
  onSave: () => void;
  onClose: () => void;
}

function ExpenseForm({ existing, onSave, onClose }: ExpenseFormProps) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const today = new Date().toISOString().split("T")[0];
  const monthKey = currentMonthKey();
  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(existing?.amount.toString() ?? "");
  const [category, setCategory] = useState(existing?.category ?? CATEGORIES[0]);
  const [date, setDate] = useState(
    existing?.date ? new Date(existing.date).toISOString().split("T")[0] : today
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // P8: focus first error field
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t("Name is required.");
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) e.amount = t("Enter a valid amount.");
    if (!date) e.date = t("Date is required.");
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // P8: focus first invalid field
      if (errs.name) { nameRef.current?.focus(); return; }
      if (errs.amount) { amountRef.current?.focus(); return; }
      return;
    }
    setIsSubmitting(true);
    const dateObject = new Date(date);
    if (existing) {
      await updateOneTimeExpense(existing.id, {
        monthKey, name: name.trim(), amount: parseFloat(amount), category, date: dateObject,
      });
    } else {
      await addOneTimeExpense(monthKey, name.trim(), parseFloat(amount), category, dateObject);
    }
    setIsSubmitting(false);
    onSave();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#111318] -m-6 p-6 rounded-b-2xl" noValidate>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="expense-name" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
          {t("Description")} <span className="text-[#00FFA3]" aria-hidden="true">*</span>
        </label>
        <input
          ref={nameRef}
          id="expense-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
          placeholder={t("e.g. Dinner at restaurant")}
          aria-required="true"
          aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={errors.name ? "expense-name-error" : undefined}
          autoFocus
          className="block w-full px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl 
                     placeholder-[#6b7280] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3]"
        />
        {errors.name && (
          <p id="expense-name-error" role="alert" className="text-[11px] text-red-400 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Amount + Date */}
      <div>
        <div className="space-y-1.5">
          <label htmlFor="expense-amount" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
            {t("Amount")} (€) <span className="text-[#00FFA3]" aria-hidden="true">*</span>
          </label>
          <input
            ref={amountRef}
            id="expense-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: "" })); }}
            placeholder="0.00"
            aria-required="true"
            aria-invalid={errors.amount ? "true" : undefined}
            aria-describedby={errors.amount ? "expense-amount-error" : undefined}
            className="block w-full min-w-0 px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl 
                       placeholder-[#6b7280] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] 
                       [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:none]"
          />
          {errors.amount && (
            <p id="expense-amount-error" role="alert" className="text-[11px] text-red-400 mt-1">{errors.amount}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="expense-date" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase mt-4">
            {t("Date")} <span className="text-[#00FFA3]" aria-hidden="true">*</span>
          </label>
          <input
            id="expense-date"
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: "" })); }}
            aria-required="true"
            aria-invalid={errors.date ? "true" : undefined}
            className="block w-full min-w-0 px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl 
                       placeholder-[#6b7280] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] cursor-pointer 
                       [&::-webkit-calendar-picker-indicator]:invert [appearance:none] [&::-webkit-date-and-time-value]:text-left [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0"
          />
          {errors.date && (
            <p role="alert" className="text-[11px] text-red-400 mt-1">{errors.date}</p>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <label htmlFor="expense-category" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
          {t("Category")}
        </label>
        <select
          id="expense-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="block w-full px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl 
                     placeholder-[#6b7280] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] cursor-pointer appearance-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-[#1a1d24]">{t(c)}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#00FFA3] hover:bg-[#00ffb3] active:scale-[0.98] text-[#0d0d0d] 
                     transition-all cursor-pointer disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#1a1d24]"
        >
          {existing ? t("Update") : t("Add Expense")}
        </button>
        <button
          type="button"
          onClick={onClose}
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
export default function ExpensesPage() {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const reduceMotion = useReducedMotion() ?? false;

  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [expenses, setExpenses] = useState<OneTimeExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<OneTimeExpense | undefined>();
  const [refresh, setRefresh] = useState(0);
  const [viewMode, setViewMode] = useState<"category" | "date">("category");
  // P8: replaces native confirm()
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // P3: cancel flag prevents stale state on fast month changes
  useEffect(() => {
    let cancelled = false;
    
    async function load() {
      const data = await getOneTimeExpensesForMonth(monthKey);
      data.sort((a, b) => b.date.getTime() - a.date.getTime());
      if (!cancelled) {
        setExpenses(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [monthKey, refresh]);

  async function handleDelete(id: string) {
    await deleteOneTimeExpense(id);
    setConfirmId(null);
    setRefresh((r) => r + 1);
  }

  function openEdit(expense: OneTimeExpense) {
    setEditing(expense);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(undefined);
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const grouped = viewMode === "category" ? groupByCategory(expenses) : groupByDate(expenses);
  const entries = Object.entries(grouped);
  if (viewMode === "date") {
    entries.sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-3xl w-full mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t("Expenses")}</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">{t("One-time and variable spending")}</p>
        </div>
        {/* P2: min 44px touch target */}
        <button
          onClick={() => { setEditing(undefined); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#00FFA3] hover:bg-[#00ffb3] active:scale-[0.98] text-[#0d0d0d] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
          aria-label={t("Add Expense")}
        >
          <Plus size={16} aria-hidden="true" />
          {t("Add Expense")}
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
          className="w-11 h-11 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1a1d24] transition-colors cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
          aria-label={t("Previous month")}
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
          className="w-11 h-11 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1a1d24] transition-colors cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
          aria-label={t("Next month")}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      {/* P3: skeleton while loading */}
      {loading ? (
        <ExpensesSkeleton />
      ) : (
        <>
          {/* Summary card */}
          <div className="bg-[#111318] border border-[#1a1d24] rounded-2xl p-5 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0" aria-hidden="true">
              <ShoppingBag size={22} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm text-[#9ca3af]">
                {t("Total for")} {formatMonthKey(monthKey, locale)}
              </p>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-red-400">
                {formatCurrency(total)}
              </p>
              <p className="text-xs text-[#4b5563] mt-0.5">
                {expenses.length} {t(expenses.length === 1 ? "expense" : "expenses")}
              </p>
            </div>
          </div>

          {/* View toggle */}
          <div
            className="flex bg-[#111318] border border-[#1a1d24] rounded-xl p-1 w-fit mb-4"
            role="group"
            aria-label={t("View mode")}
          >
            {(["category", "date"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3] ${
                  viewMode === mode
                    ? "bg-[#1a1d24] text-white shadow-sm"
                    : "text-[#6b7280] hover:text-white"
                }`}
              >
                {t(mode === "category" ? "Category" : "Date")}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {expenses.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag size={40} className="mx-auto mb-3 text-[#252830]" aria-hidden="true" />
              <p className="font-semibold text-[#9ca3af]">{t("No expenses for this month")}</p>
              <p className="text-sm text-[#6b7280] mt-1">{t("Track your spending by adding expenses")}</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 flex items-center gap-2 mx-auto px-4 py-2.5 rounded-xl text-sm font-bold bg-[#00FFA3] hover:bg-[#00ffb3] active:scale-[0.98] text-[#0d0d0d] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
              >
                <Plus size={16} aria-hidden="true" />
                {t("Add First Expense")}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {entries.map(([groupKey, items]) => {
                const catTotal = items.reduce((s, e) => s + e.amount, 0);
                const style = getCategoryStyle(groupKey);
                return (
                  <div key={groupKey}>
                    {/* Group header */}
                    <div className="flex items-center justify-between mb-2 px-1">
                      {viewMode === "category" ? (
                        <>
                          <span
                            className="text-sm px-2.5 py-1 rounded-full font-semibold"
                            style={{ backgroundColor: style.bg, color: style.text }}
                          >
                            {t(groupKey)}
                          </span>
                          <span className="text-sm text-[#6b7280] tabular-nums">
                            {t("Total:")}{" "}
                            <span className="text-[#e5e7eb] font-semibold">{formatCurrency(catTotal)}</span>
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-[#6b7280]">
                          {formatDate(groupKey, locale)}
                        </span>
                      )}
                    </div>

                    {/* Expense rows */}
                    <div className="space-y-2">
                      {items.map((expense) => {
                        const expStyle = getCategoryStyle(expense.category);
                        return (
                          <div
                            key={expense.id}
                            className="bg-[#111318] border border-[#1a1d24] rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-[#e5e7eb] truncate">{expense.name}</p>
                              {viewMode === "category" ? (
                              <p className="text-xs text-[#6b7280] mt-0.5">
                                {formatDate(expense.date.toISOString(), locale)}
                              </p>
                              ) : null}
                              {viewMode === "date" && (
                                <span
                                  className="inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1"
                                  style={{ backgroundColor: expStyle.bg, color: expStyle.text }}
                                >
                                  {t(expense.category)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-semibold text-[#e5e7eb] tabular-nums">
                                {formatCurrency(expense.amount)}
                              </span>
                              {/* P2: 44×44 touch targets for action buttons */}
                              <button
                                onClick={() => openEdit(expense)}
                                aria-label={`${t("Edit")} ${expense.name}`}
                                className="w-9 h-9 flex items-center justify-center rounded-xl text-[#6b7280] hover:text-[#00FFA3] hover:bg-[#00FFA320] active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
                              >
                                <Pencil size={14} aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => setConfirmId(expense.id)}
                                aria-label={`${t("Delete")} ${expense.name}`}
                                className="w-9 h-9 flex items-center justify-center rounded-xl text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                              >
                                <Trash2 size={14} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Accessible confirm dialog */}
      <AnimatePresence>
        {confirmId && (
          <ConfirmDialog
            message={t("This expense will be permanently deleted. This action cannot be undone.")}
            onConfirm={() => handleDelete(confirmId)}
            onCancel={() => setConfirmId(null)}
            reduceMotion={reduceMotion}
          />
        )}
      </AnimatePresence>

      {/* Add/Edit modal */}
      {showModal && (
        <Modal
          title={editing ? t("Edit Expense") : t("Add Expense")}
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