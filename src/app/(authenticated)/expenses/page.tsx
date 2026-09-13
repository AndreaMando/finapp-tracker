"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, ShoppingBag, ChevronLeft, ChevronRight,
  RefreshCw, Archive, RotateCw,
} from "lucide-react";
import {
  currentMonthKey,
  formatMonthKey,
  formatDate,
  getOneTimeExpenses,
  getOneTimeExpensesForMonth,
  addOneTimeExpense,
  deleteOneTimeExpense,
  updateOneTimeExpense,
  getRecurringExpenses,
  addRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  type OneTimeExpense,
  type RecurringExpense,
} from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import RecurringApplyModal from "@/components/RecurringApplyModal";
import { useTranslation } from "@/lib/i18n";
import { useCountUp } from "@/hooks/useCountUp";

// ─────────────────────────────────────────────────────────────────────────────
// This page is the merged Expenses + Recurring Expenses surface: the Expenses
// section (month-scrub one-time spending, yearly chart, 3 view modes) renders
// first, the Recurring Expenses section (Active/Concluded/Upcoming ledger)
// renders second beneath a hairline divider, at #recurring so the old
// /recurring route's redirect (see recurring/page.tsx) actually lands on it.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const ONE_TIME_CATEGORIES = [
  "Food & Dining", "Shopping", "Entertainment", "Travel",
  "Health", "Personal Care", "Gifts", "Home", "Housing",
  "Utilities", "Insurance", "Subscriptions", "Transport",
  "Financing", "Mortgage", "Other",
];

const RECURRING_CATEGORIES = [
  "Housing", "Utilities", "Insurance", "Subscriptions",
  "Transport", "Health", "Financing", "Mortgage", "Other",
];

// Category tag hues are data-categorization colors (same pattern as the
// per-goal colors elsewhere in the app), not part of the four core ledger
// tokens — kept as their own small palettes, one per expense kind, matching
// what each source page shipped with.
const ONE_TIME_CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Food & Dining":  { bg: "#ef444420", text: "#ef4444" },
  Shopping:         { bg: "#f9731620", text: "#f97316" },
  Entertainment:    { bg: "#eab30820", text: "#eab308" },
  Travel:           { bg: "#22c55e20", text: "#22c55e" },
  Health:           { bg: "#14b8a620", text: "#14b8a6" },
  "Personal Care":  { bg: "#3b82f620", text: "#3b82f6" },
  Gifts:            { bg: "#6366f120", text: "#6366f1" },
  Home:             { bg: "#a855f720", text: "#a855f7" },
  Housing:          { bg: "#ec489920", text: "#ec4899" },
  Utilities:        { bg: "#f43f5e20", text: "#f43f5e" },
  Insurance:        { bg: "#06b6d420", text: "#06b6d4" },
  Subscriptions:    { bg: "#84cc1620", text: "#84cc16" },
  Transport:        { bg: "#0ea5e920", text: "#0ea5e9" },
  Financing:        { bg: "#f59e0b20", text: "#f59e0b" },
  Mortgage:         { bg: "#10b98120", text: "#10b981" },
  Other:            { bg: "#9ca3af20", text: "#9ca3af" },
};

const RECURRING_CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Housing:          { bg: "#ec489920", text: "#ec4899" },
  Utilities:        { bg: "#f43f5e20", text: "#f43f5e" },
  Insurance:        { bg: "#06b6d420", text: "#06b6d4" },
  Subscriptions:    { bg: "#84cc1620", text: "#84cc16" },
  Transport:        { bg: "#0ea5e920", text: "#0ea5e9" },
  Financing:        { bg: "#f59e0b20", text: "#f59e0b" },
  Mortgage:         { bg: "#10b98120", text: "#10b981" },
  Health:           { bg: "#f9731620", text: "#f97316" },
  Other:            { bg: "#9ca3af20", text: "#9ca3af" },
};

function getOneTimeCategoryStyle(cat: string) {
  return ONE_TIME_CATEGORY_COLORS[cat] ?? ONE_TIME_CATEGORY_COLORS.Other;
}
function getRecurringCategoryStyle(cat: string) {
  return RECURRING_CATEGORY_COLORS[cat] ?? RECURRING_CATEGORY_COLORS.Other;
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

function previousMonthKey(): string {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
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

interface MonthTotal {
  monthKey: string;
  label: string;
  total: number;
}

function buildYearlyTotals(all: OneTimeExpense[], year: number, locale: string): MonthTotal[] {
  return Array.from({ length: 12 }, (_, i) => {
    const monthKey = `${year}-${String(i + 1).padStart(2, "0")}`;
    const total = all
      .filter((e) => e.monthKey === monthKey)
      .reduce((s, e) => s + e.amount, 0);
    let label = new Date(year, i, 1).toLocaleDateString(locale, { month: "short" });
    label = label.replace(/\.$/, "");
    return { monthKey, label, total };
  });
}

// ─────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-sunken rounded-lg animate-pulse ${className}`} aria-hidden="true" />;
}

function ExpensesSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading expenses...">
      <div className="flex flex-col items-center gap-3 mb-10">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-12 w-56" />
      </div>
      <Skeleton className="h-[180px] w-full mb-10" />
      <div className="space-y-0 border-t border-hairline">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-3.5 border-b border-hairline">
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

function RecurringSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading recurring expenses...">
      <Skeleton className="h-20 w-full mb-8" />
      <div className="space-y-0 border-t border-hairline">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-4 border-b border-hairline">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Monthly outflow chart — hand-rolled inline SVG, flat hairline bars toned
// as an outflow (negative token), no gradients/shadows/new dependency.
// Mirrors the shape of the Income page's yearly bar chart but in the
// negative register since this is spending, not income.
// ─────────────────────────────────────────────
function OneTimeExpenseChart({
  data, highlightMonthKey, t,
}: {
  data: MonthTotal[];
  highlightMonthKey: string;
  t: (key: string) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const hasData = data.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[180px] border border-dashed border-hairline rounded-lg">
        <p className="text-sm text-ink-faint">{t("No expenses recorded for this year yet")}</p>
      </div>
    );
  }

  const W = 760;
  const H = 190;
  const padX = 6;
  const padTop = 10;
  const padBottom = 24;
  const gap = 10;
  const plotW = W - padX * 2;
  const plotH = H - padTop - padBottom;
  const barWidth = (plotW - gap * (data.length - 1)) / data.length;

  const summary = data.map((d) => `${d.label} ${formatCurrency(d.total)}`).join(", ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`${t("One-time expenses by month")}: ${summary}`}
      preserveAspectRatio="none"
    >
      <line
        x1={padX} y1={H - padBottom} x2={W - padX} y2={H - padBottom}
        style={{ stroke: "var(--hairline)" }} strokeWidth={1}
      />
      {data.map((d, i) => {
        const x = padX + i * (barWidth + gap);
        const h = d.total > 0 ? Math.max(2, (d.total / max) * plotH) : 0;
        const y = H - padBottom - h;
        const isActive = d.monthKey === highlightMonthKey;
        return (
          <g key={d.monthKey}>
            <rect
              x={x} y={y} width={barWidth} height={h}
              style={{ fill: "var(--negative)", opacity: isActive ? 1 : 0.35 }}
            >
              {d.total > 0 && <title>{`${d.label}: ${formatCurrency(d.total)}`}</title>}
            </rect>
            <text
              x={x + barWidth / 2}
              y={H - padBottom + 15}
              textAnchor="middle"
              style={{ fill: "var(--ink-faint)", fontSize: 9 }}
              className="font-mono uppercase"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// One-time expense form (inside modal)
// ─────────────────────────────────────────────
interface ExpenseFormProps {
  existing?: OneTimeExpense;
  onSave: () => void;
  onClose: () => void;
}

function ExpenseForm({ existing, onSave, onClose }: ExpenseFormProps) {
  const { t } = useTranslation();
  const today = new Date().toISOString().split("T")[0];
  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(existing?.amount.toString() ?? "");
  const [category, setCategory] = useState(existing?.category ?? ONE_TIME_CATEGORIES[0]);
  const [date, setDate] = useState(
    existing?.date ? new Date(existing.date).toISOString().split("T")[0] : today
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      if (errs.name) { nameRef.current?.focus(); return; }
      if (errs.amount) { amountRef.current?.focus(); return; }
      return;
    }
    setIsSubmitting(true);
    const dateObject = new Date(date);
    const monthKeyFromDate = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, "0")}`;
    if (existing) {
      await updateOneTimeExpense(existing.id, {
        monthKey: monthKeyFromDate, name: name.trim(), amount: parseFloat(amount), category, date: dateObject,
      });
    } else {
      await addOneTimeExpense(monthKeyFromDate, name.trim(), parseFloat(amount), category, dateObject);
    }
    setIsSubmitting(false);
    onSave();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="expense-name" className="block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Description")} <span className="text-accent" aria-hidden="true">*</span>
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
          className="block w-full px-4 py-3 text-sm text-ink bg-surface-sunken border border-hairline rounded-lg
                     placeholder-ink-faint transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
        />
        {errors.name && (
          <p id="expense-name-error" role="alert" className="text-[11px] text-negative mt-1">{errors.name}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="expense-amount" className="block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Amount")} (€) <span className="text-accent" aria-hidden="true">*</span>
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
          className="block w-full min-w-0 px-4 py-3 text-sm font-mono tabular-nums text-ink bg-surface-sunken border border-hairline rounded-lg
                     placeholder-ink-faint transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
                     [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:none]"
        />
        {errors.amount && (
          <p id="expense-amount-error" role="alert" className="text-[11px] text-negative mt-1">{errors.amount}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="expense-date" className="block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Date")} <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="expense-date"
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: "" })); }}
          aria-required="true"
          aria-invalid={errors.date ? "true" : undefined}
          className="block w-full min-w-0 px-4 py-3 text-sm font-mono text-ink bg-surface-sunken border border-hairline rounded-lg
                     transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer"
        />
        {errors.date && (
          <p role="alert" className="text-[11px] text-negative mt-1">{errors.date}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="expense-category" className="block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Category")}
        </label>
        <select
          id="expense-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="block w-full px-4 py-3 text-sm text-ink bg-surface-sunken border border-hairline rounded-lg
                     transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer appearance-none"
        >
          {ONE_TIME_CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(c)}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="flex-1 py-3 rounded-lg text-sm font-bold bg-accent hover:brightness-110 active:scale-[0.98] text-accent-contrast
                     transition-all cursor-pointer disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {existing ? t("Update") : t("Add Expense")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-lg text-sm font-semibold bg-surface-sunken hover:bg-hairline text-ink active:scale-[0.98]
                     transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t("Cancel")}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// One-time expense row — flat, hairline-divided (no nested cards). `showDate`
// and `showCategoryBadge` toggle which per-row details appear, since the
// Category and Date view modes each imply one of them via their group
// header while the flat Amount view must show both on the row itself.
// ─────────────────────────────────────────────
function ExpenseRow({
  expense, showDate, showCategoryBadge, locale, onEdit, onDelete, t,
}: {
  expense: OneTimeExpense;
  showDate: boolean;
  showCategoryBadge: boolean;
  locale: string;
  onEdit: (e: OneTimeExpense) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}) {
  const style = getOneTimeCategoryStyle(expense.category);
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink truncate">{expense.name}</p>
        {(showDate || showCategoryBadge) && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {showDate && (
              <span className="text-xs font-mono text-ink-muted tabular-nums">
                {formatDate(expense.date.toISOString(), locale)}
              </span>
            )}
            {showCategoryBadge && (
              <span
                className="inline-block text-[10px] font-mono font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                style={{ backgroundColor: style.bg, color: style.text }}
              >
                {t(expense.category)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span className="font-mono font-semibold text-ink tabular-nums mr-1">
          {formatCurrency(expense.amount)}
        </span>
        <button
          onClick={() => onEdit(expense)}
          aria-label={`${t("Edit")} ${expense.name}`}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-faint hover:text-accent hover:bg-accent/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Pencil size={14} aria-hidden="true" />
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          aria-label={`${t("Delete")} ${expense.name}`}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-faint hover:text-negative hover:bg-negative/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-negative"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Recurring expense form (inside modal)
// ─────────────────────────────────────────────
interface RecurringFormProps {
  existing?: RecurringExpense;
  onSave: () => void;
  onClose: () => void;
}

function RecurringExpenseForm({ existing, onSave, onClose }: RecurringFormProps) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const todayKey = currentMonthKey();
  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(existing?.amount.toString() ?? "");
  const [category, setCategory] = useState(existing?.category ?? RECURRING_CATEGORIES[0]);
  const [startMonth, setStartMonth] = useState(existing?.startMonth ?? todayKey);
  const [endMonth] = useState<string>(existing?.endMonth ?? "");
  const DEFAULT_APPLY_PREF_KEY = "recurringApplyFromDefault";
  const [applyPref, setApplyPref] = useState<"current" | "next">(() => {
    try {
      return (localStorage.getItem(DEFAULT_APPLY_PREF_KEY) as "current" | "next") || "current";
    } catch {
      return "current";
    }
  });
  function computeApplyFrom(pref: "current" | "next") {
    const now = new Date();
    const month = pref === "next" ? new Date(now.getFullYear(), now.getMonth() + 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1);
    return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  }
  const [applyFrom, setApplyFrom] = useState<string>(computeApplyFrom(applyPref));

  useEffect(() => {
    try { localStorage.setItem(DEFAULT_APPLY_PREF_KEY, applyPref); } catch { /* ignore */ }
  }, [applyPref]);

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
      const parsed = parseFloat(amount);
      const updates: Partial<Omit<RecurringExpense, "id" | "createdAt">> & { applyFromMonth?: string } = {
        name: name.trim(), category, startMonth,
      };
      if (!Number.isNaN(parsed) && parsed !== existing.amount) {
        updates.amount = parsed;
        updates.applyFromMonth = applyFrom;
      }
      const currentExistingEnd = existing.endMonth ?? null;
      const newEnd = endMonth === "" ? null : endMonth;
      if (newEnd !== currentExistingEnd) updates.endMonth = newEnd;
      await updateRecurringExpense(existing.id, updates);
    } else {
      await addRecurringExpense(name.trim(), parseFloat(amount), category, startMonth, endMonth === "" ? null : endMonth);
    }
    setIsSubmitting(false);
    onSave();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="rec-name" className="block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Name")} <span className="text-accent" aria-hidden="true">*</span>
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
          className="block w-full px-4 py-3 text-sm text-ink bg-surface-sunken border border-hairline rounded-lg
                     placeholder-ink-faint transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
        />
        {errors.name && <p id="rec-name-error" role="alert" className="text-[11px] text-negative mt-1">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="rec-amount" className="block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Monthly Amount (€)")} <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          ref={amountRef}
          id="rec-amount" type="number" min="0" value={amount}
          onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: "" })); }}
          placeholder="0.00"
          aria-required="true"
          aria-invalid={errors.amount ? "true" : undefined}
          aria-describedby={errors.amount ? "rec-amount-error" : undefined}
          className="block w-full px-4 py-3 text-sm font-mono tabular-nums text-ink bg-surface-sunken border border-hairline rounded-lg
                     transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
                     [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {errors.amount && <p id="rec-amount-error" role="alert" className="text-[11px] text-negative mt-1">{errors.amount}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="rec-category" className="block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Category")}
        </label>
        <select
          id="rec-category" value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="block w-full px-4 py-3 text-sm text-ink bg-surface-sunken border border-hairline rounded-lg
                     transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer appearance-none"
        >
          {RECURRING_CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(c)}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="rec-start" className="block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Start Month")} <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="rec-start"
          type="month"
          value={startMonth}
          onChange={(e) => { setStartMonth(e.target.value); setErrors((p) => ({ ...p, startMonth: "" })); }}
          aria-required="true"
          aria-invalid={errors.startMonth ? "true" : undefined}
          aria-describedby={errors.startMonth ? "rec-start-error" : undefined}
          className="block w-full min-w-0 px-4 py-3 text-sm font-mono text-ink bg-surface-sunken border border-hairline rounded-lg
                     transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer capitalize"
        />
        {errors.startMonth && <p id="rec-start-error" role="alert" className="text-[11px] text-negative mt-1">{errors.startMonth}</p>}
      </div>

      {existing && (
        <div className="space-y-1.5">
          <label className="block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
            {t("Apply modification from")}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setApplyPref("current"); setApplyFrom(computeApplyFrom("current")); }}
              aria-pressed={applyPref === "current"}
              className={`flex-1 text-left px-4 py-3 rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                applyPref === "current"
                  ? "bg-accent/10 border-accent text-ink"
                  : "bg-surface-sunken border-hairline text-ink-muted hover:text-ink"
              }`}
            >
              <div className="text-sm font-medium">{t("Current month")}</div>
              <div className="text-xs font-mono text-ink-faint mt-0.5">{formatMonthKey(computeApplyFrom("current"), locale)}</div>
            </button>

            <button
              type="button"
              onClick={() => { setApplyPref("next"); setApplyFrom(computeApplyFrom("next")); }}
              aria-pressed={applyPref === "next"}
              className={`flex-1 text-left px-4 py-3 rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                applyPref === "next"
                  ? "bg-accent/10 border-accent text-ink"
                  : "bg-surface-sunken border-hairline text-ink-muted hover:text-ink"
              }`}
            >
              <div className="text-sm font-medium">{t("Next month")}</div>
              <div className="text-xs font-mono text-ink-faint mt-0.5">{formatMonthKey(computeApplyFrom("next"), locale)}</div>
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit" disabled={isSubmitting} aria-busy={isSubmitting}
          className="flex-1 py-3 rounded-lg text-sm font-bold bg-accent hover:brightness-110 active:scale-[0.98] text-accent-contrast
                     transition-all cursor-pointer disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {existing ? t("Update") : t("Add Expense")}
        </button>
        <button
          type="button" onClick={onClose}
          className="flex-1 py-3 rounded-lg text-sm font-semibold bg-surface-sunken hover:bg-hairline text-ink active:scale-[0.98]
                     transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t("Cancel")}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Unified add form — the single "Add Expense" entry point for both kinds.
// Shares Description / Amount / Category; the last field is one UI slot that
// doubles as either the one-time expense's date or the recurring expense's
// start month, switched by the "Make recurring" checkbox beside it. This is
// ADD-only: editing an existing one-time or recurring expense still goes
// through the two dedicated forms above, which keep fields (Apply modification
// from, end month, etc.) that don't cleanly fit a shared add form.
// ─────────────────────────────────────────────
interface UnifiedAddFormProps {
  onSave: (kind: "one-time" | "recurring") => void;
  onClose: () => void;
}

function UnifiedAddExpenseForm({ onSave, onClose }: UnifiedAddFormProps) {
  const { t } = useTranslation();
  const today = new Date().toISOString().split("T")[0];
  const todayMonthKey = currentMonthKey();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [category, setCategory] = useState(ONE_TIME_CATEGORIES[0]);
  const [date, setDate] = useState(today);
  const [startMonth, setStartMonth] = useState(todayMonthKey);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const categories = isRecurring ? RECURRING_CATEGORIES : ONE_TIME_CATEGORIES;

  function handleRecurringToggle(checked: boolean) {
    setIsRecurring(checked);
    const list = checked ? RECURRING_CATEGORIES : ONE_TIME_CATEGORIES;
    if (!list.includes(category)) setCategory(list[0]);
    setErrors((p) => ({ ...p, date: "", startMonth: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t("Name is required.");
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) e.amount = t("Enter a valid amount.");
    if (isRecurring) {
      if (!startMonth) e.startMonth = t("Start month is required.");
    } else if (!date) {
      e.date = t("Date is required.");
    }
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
    const parsedAmount = parseFloat(amount);
    if (isRecurring) {
      await addRecurringExpense(name.trim(), parsedAmount, category, startMonth, null);
    } else {
      const dateObject = new Date(date);
      const monthKeyFromDate = `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, "0")}`;
      await addOneTimeExpense(monthKeyFromDate, name.trim(), parsedAmount, category, dateObject);
    }
    setIsSubmitting(false);
    onSave(isRecurring ? "recurring" : "one-time");
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="unified-expense-name" className="block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Description")} <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          ref={nameRef}
          id="unified-expense-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
          placeholder={t("e.g. Dinner at restaurant")}
          aria-required="true"
          aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={errors.name ? "unified-expense-name-error" : undefined}
          autoFocus
          className="block w-full px-4 py-3 text-sm text-ink bg-surface-sunken border border-hairline rounded-lg
                     placeholder-ink-faint transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
        />
        {errors.name && (
          <p id="unified-expense-name-error" role="alert" className="text-[11px] text-negative mt-1">{errors.name}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="unified-expense-amount" className="block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Amount")} (€) <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          ref={amountRef}
          id="unified-expense-amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: "" })); }}
          placeholder="0.00"
          aria-required="true"
          aria-invalid={errors.amount ? "true" : undefined}
          aria-describedby={errors.amount ? "unified-expense-amount-error" : undefined}
          className="block w-full min-w-0 px-4 py-3 text-sm font-mono tabular-nums text-ink bg-surface-sunken border border-hairline rounded-lg
                     placeholder-ink-faint transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
                     [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:none]"
        />
        {errors.amount && (
          <p id="unified-expense-amount-error" role="alert" className="text-[11px] text-negative mt-1">{errors.amount}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="unified-expense-category" className="block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Category")}
        </label>
        <select
          id="unified-expense-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="block w-full px-4 py-3 text-sm text-ink bg-surface-sunken border border-hairline rounded-lg
                     transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer appearance-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{t(c)}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="unified-expense-date" className="block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
            {isRecurring ? t("Start Month") : t("Date")} <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <label htmlFor="unified-expense-recurring" className="flex items-center gap-1.5 text-xs font-medium text-ink-muted cursor-pointer select-none">
            <input
              id="unified-expense-recurring"
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => handleRecurringToggle(e.target.checked)}
              className="w-4 h-4 rounded accent-accent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            {t("Make recurring")}
          </label>
        </div>
        {isRecurring ? (
          <input
            id="unified-expense-date"
            type="month"
            value={startMonth}
            onChange={(e) => { setStartMonth(e.target.value); setErrors((p) => ({ ...p, startMonth: "" })); }}
            aria-required="true"
            aria-invalid={errors.startMonth ? "true" : undefined}
            aria-describedby={errors.startMonth ? "unified-expense-date-error" : undefined}
            className="block w-full min-w-0 px-4 py-3 text-sm font-mono text-ink bg-surface-sunken border border-hairline rounded-lg
                       transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer capitalize"
          />
        ) : (
          <input
            id="unified-expense-date"
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: "" })); }}
            aria-required="true"
            aria-invalid={errors.date ? "true" : undefined}
            aria-describedby={errors.date ? "unified-expense-date-error" : undefined}
            className="block w-full min-w-0 px-4 py-3 text-sm font-mono text-ink bg-surface-sunken border border-hairline rounded-lg
                       transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer"
          />
        )}
        {(errors.date || errors.startMonth) && (
          <p id="unified-expense-date-error" role="alert" className="text-[11px] text-negative mt-1">{errors.date || errors.startMonth}</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="flex-1 py-3 rounded-lg text-sm font-bold bg-accent hover:brightness-110 active:scale-[0.98] text-accent-contrast
                     transition-all cursor-pointer disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {t("Add Expense")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-lg text-sm font-semibold bg-surface-sunken hover:bg-hairline text-ink active:scale-[0.98]
                     transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t("Cancel")}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Recurring expense row — flat, hairline-divided
// ─────────────────────────────────────────────
function RecurringRow({
  expense, locale, paused, upcoming, onEdit, onDelete, onConclude, onRestore, t,
}: {
  expense: RecurringExpense;
  locale: string;
  paused?: boolean;
  upcoming?: boolean;
  onEdit: (e: RecurringExpense) => void;
  onDelete: (id: string) => void;
  onConclude: (e: RecurringExpense) => void;
  onRestore: (e: RecurringExpense) => void;
  t: (key: string) => string;
}) {
  const style = getRecurringCategoryStyle(expense.category);

  return (
    <div className={`flex items-center justify-between gap-4 py-4 ${paused ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className={`font-medium truncate ${paused ? "text-ink-muted line-through" : "text-ink"}`}>
          {expense.name}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span
            className="inline-block text-[10px] font-mono font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: paused ? "var(--surface-sunken)" : style.bg,
              color: paused ? "var(--ink-faint)" : style.text,
            }}
          >
            {t(expense.category)}
          </span>
          <span className="text-[10px] font-mono text-ink-faint tabular-nums">
            {upcoming ? t("Starts:") : t("Started:")} {formatMonthKey(expense.startMonth, locale)}
          </span>
          {expense.endMonth && (
            <span className="text-[10px] font-mono text-ink-faint tabular-nums">
              {t("End Month")}: {formatMonthKey(expense.endMonth, locale)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span className={`font-mono font-semibold tabular-nums text-sm mr-1 ${paused ? "text-ink-faint" : "text-ink"}`}>
          {formatCurrency(expense.amount)}
          <span className="text-xs text-ink-faint font-normal ml-0.5">{t("/mo")}</span>
        </span>
        <button
          onClick={() => onEdit(expense)}
          aria-label={`${t("Edit")} ${expense.name}`}
          title={t("Edit")}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-faint hover:text-accent hover:bg-accent/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Pencil size={14} aria-hidden="true" />
        </button>
        {!expense.endMonth ? (
          <button
            onClick={() => onConclude(expense)}
            aria-label={`${t("Conclude")} ${expense.name}`}
            title={t("Conclude")}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-faint hover:text-ink hover:bg-surface-sunken active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Archive size={14} aria-hidden="true" />
          </button>
        ) : (
          <button
            onClick={() => onRestore(expense)}
            aria-label={`${t("Restore")} ${expense.name}`}
            title={t("Restore")}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-faint hover:text-accent hover:bg-accent/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <RotateCw size={14} aria-hidden="true" />
          </button>
        )}
        <button
          onClick={() => onDelete(expense.id)}
          aria-label={`${t("Delete")} ${expense.name}`}
          title={t("Delete")}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-faint hover:text-negative hover:bg-negative/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-negative"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ label, count, t }: { label: string; count: number; t: (key: string) => string }) {
  return (
    <div className="flex items-center justify-between mb-1 px-0.5">
      <h3 className="text-[11px] font-mono font-bold tracking-widest uppercase text-ink-faint">{label}</h3>
      <span className="text-[11px] font-mono text-ink-faint tabular-nums">{t("Number of entries")}: {count}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function ExpensesPage() {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const reduceMotion = useReducedMotion() ?? false;

  // ─── Tab state ────────────────────────────────────────────────────────────
  // Defaults to One-time; a page load at /expenses#recurring (the old
  // /recurring route's redirect target) opens directly on the Recurring tab
  // instead of just scrolling to it, since the two sections are no longer
  // stacked on one scrollable page.
  const [activeTab, setActiveTab] = useState<"one-time" | "recurring">("one-time");
  useEffect(() => {
    if (window.location.hash === "#recurring") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab("recurring");
    }
  }, []);
  function selectTab(tab: "one-time" | "recurring") {
    setActiveTab(tab);
    const hash = tab === "recurring" ? "#recurring" : "";
    window.history.replaceState(null, "", window.location.pathname + window.location.search + hash);
  }

  // ─── Expenses (one-time) state ───────────────────────────────────────────
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [expenses, setExpenses] = useState<OneTimeExpense[]>([]);
  const [allOneTime, setAllOneTime] = useState<OneTimeExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [editing, setEditing] = useState<OneTimeExpense | undefined>();
  const [refresh, setRefresh] = useState(0);
  const [viewMode, setViewMode] = useState<"category" | "date" | "amount">("category");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // ─── Recurring expenses state ────────────────────────────────────────────
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [recurringLoading, setRecurringLoading] = useState(true);
  const [showRecModal, setShowRecModal] = useState(false);
  const [editingRec, setEditingRec] = useState<RecurringExpense | undefined>();
  const [recRefresh, setRecRefresh] = useState(0);
  const [confirmRecId, setConfirmRecId] = useState<string | null>(null);
  const [concludeCandidate, setConcludeCandidate] = useState<RecurringExpense | null>(null);
  const [recActionError, setRecActionError] = useState("");

  // Month's one-time expenses
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

  // All one-time expenses, for the yearly chart — small dataset for a
  // personal finance tracker, so one fetch (refetched on mutations) is
  // simpler than a per-year endpoint and avoids refetching on every
  // month-scrub within the same year.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await getOneTimeExpenses();
      if (!cancelled) setAllOneTime(data);
    }
    load();
    return () => { cancelled = true; };
  }, [refresh]);

  // Recurring expenses — always relative to the real current month, exactly
  // as the original standalone recurring page did (no month-scrub there).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const key = currentMonthKey();
      const data = await getRecurringExpenses(key);
      data.sort((a, b) => a.name.localeCompare(b.name));
      if (!cancelled) {
        setRecurring(data);
        setRecurringLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [recRefresh]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const animatedTotal = useCountUp(total, reduceMotion);

  const year = Number(monthKey.split("-")[0]);
  const yearlyTotals = useMemo(
    () => buildYearlyTotals(allOneTime, year, locale),
    [allOneTime, year, locale]
  );

  async function handleDelete(id: string) {
    try {
      await deleteOneTimeExpense(id);
      setConfirmId(null);
      setRefresh((r) => r + 1);
    } catch (err) {
      setConfirmId(null);
      setActionError(err instanceof Error ? err.message : t("An error occurred. Please try again."));
    }
  }

  function openEdit(expense: OneTimeExpense) {
    setEditing(expense);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(undefined);
  }

  function handleAddSaved(kind: "one-time" | "recurring") {
    if (kind === "recurring") setRecRefresh((r) => r + 1);
    else setRefresh((r) => r + 1);
  }

  // ─── Recurring handlers ───────────────────────────────────────────────
  async function handleDeleteRecurring(id: string) {
    try {
      await deleteRecurringExpense(id);
      setConfirmRecId(null);
      setRecRefresh((r) => r + 1);
    } catch (err) {
      setConfirmRecId(null);
      setRecActionError(err instanceof Error ? err.message : t("An error occurred. Please try again."));
    }
  }

  async function handleConclude(expense: RecurringExpense) {
    try {
      const end = previousMonthKey();
      await updateRecurringExpense(expense.id, { endMonth: end, active: false });
      setConcludeCandidate(null);
      setRecRefresh((r) => r + 1);
    } catch (err) {
      setConcludeCandidate(null);
      setRecActionError(err instanceof Error ? err.message : t("An error occurred. Please try again."));
    }
  }

  async function handleRestore(expense: RecurringExpense) {
    try {
      await updateRecurringExpense(expense.id, { endMonth: null, active: true });
      setRecRefresh((r) => r + 1);
    } catch (err) {
      setRecActionError(err instanceof Error ? err.message : t("An error occurred. Please try again."));
    }
  }

  function openEditRecurring(expense: RecurringExpense) {
    setEditingRec(expense);
    setShowRecModal(true);
  }

  function closeRecModal() {
    setShowRecModal(false);
    setEditingRec(undefined);
  }

  // ─── One-time view-mode derived data ──────────────────────────────────
  const grouped = viewMode === "category" ? groupByCategory(expenses) : viewMode === "date" ? groupByDate(expenses) : null;
  const groupedEntries = grouped ? Object.entries(grouped) : [];
  if (viewMode === "date") {
    groupedEntries.sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }
  const flatByAmount = [...expenses].sort((a, b) => b.amount - a.amount);

  // ─── Recurring partition (unchanged logic from the original page) ─────
  const currentKey = currentMonthKey();
  const upcomingExpenses = recurring.filter((e) => e.startMonth > currentKey);
  const concludedExpenses = recurring.filter(
    (e) => e.startMonth <= currentKey && (!e.active || (!!e.endMonth && e.endMonth < currentKey))
  );
  const activeExpenses = recurring.filter(
    (e) => e.startMonth <= currentKey && e.active && (!e.endMonth || e.endMonth >= currentKey)
  );
  const totalActive = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  const recRowProps = {
    locale,
    onEdit: openEditRecurring,
    onDelete: setConfirmRecId,
    onConclude: (e: RecurringExpense) => setConcludeCandidate(e),
    onRestore: handleRestore,
    t,
  };

  return (
    <div className="flex-1 w-full">

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* Shared page header + tab switcher — the One-time and Recurring    */}
      {/* sections used to stack vertically on one scrollable page; they   */}
      {/* now live behind an in-page tab control so either is reachable    */}
      {/* without scrolling. The "Add Expense" action is unified: it opens */}
      {/* one modal that can create either kind, per the checkbox inside.  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="expenses-heading" className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 id="expenses-heading" className="text-2xl font-bold text-ink tracking-tight">{t("Expenses")}</h1>
            <p className="text-sm text-ink-muted mt-0.5">
              {activeTab === "recurring" ? t("Bills, subscriptions, and fixed costs") : t("One-time and variable spending")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Always visible regardless of the active tab — it's a real,
                self-contained action (opens the apply-recurring modal for
                the currently-viewed month) and shouldn't disappear just
                because the user happens to be looking at the other tab. */}
            <button
              onClick={() => setShowRecurringModal(true)}
              aria-label={t("Apply Recurring Expenses")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-ink bg-surface border border-hairline transition-all duration-150 hover:bg-surface-sunken active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              <RefreshCw size={16} aria-hidden="true" />
              <span>{t("Apply Recurring")}</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-accent hover:brightness-110 active:scale-[0.98] text-accent-contrast transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              aria-label={t("Add Expense")}
            >
              <Plus size={16} aria-hidden="true" />
              {t("Add Expense")}
            </button>
          </div>
        </div>

        {/* Tab switcher — same pill-tab visual language as the Category/    */}
        {/* Date/Amount view-mode toggle below, reused here for consistency. */}
        <div
          className="flex bg-surface border border-hairline rounded-lg p-1 w-fit mb-8"
          role="tablist"
          aria-label={t("Expenses")}
        >
          <button
            type="button"
            role="tab"
            id="tab-one-time"
            aria-selected={activeTab === "one-time"}
            aria-controls="tabpanel-one-time"
            tabIndex={activeTab === "one-time" ? 0 : -1}
            onClick={() => selectTab("one-time")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              activeTab === "one-time" ? "bg-surface-sunken text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {t("One-time Expenses")}
          </button>
          <button
            type="button"
            role="tab"
            id="tab-recurring"
            aria-selected={activeTab === "recurring"}
            aria-controls="tabpanel-recurring"
            tabIndex={activeTab === "recurring" ? 0 : -1}
            onClick={() => selectTab("recurring")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              activeTab === "recurring" ? "bg-surface-sunken text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {t("Recurring Expenses")}
          </button>
        </div>

        {actionError && activeTab === "one-time" && <ErrorBanner message={actionError} />}
        {recActionError && activeTab === "recurring" && <ErrorBanner message={recActionError} />}

      {activeTab === "one-time" && (
        <div id="tabpanel-one-time" role="tabpanel" aria-labelledby="tab-one-time">
        {/* Month selector */}
        <div
          className="flex items-center gap-1 bg-surface border border-hairline rounded-lg px-2 py-1 w-fit mb-8"
          role="group"
          aria-label={t("Month navigation")}
        >
          <button
            onClick={() => setMonthKey(addMonths(monthKey, -1))}
            className="w-11 h-11 flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={t("Previous month")}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span
            className="text-sm font-semibold text-ink min-w-[120px] text-center tabular-nums select-none"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatMonthKey(monthKey, locale)}
          </span>
          <button
            onClick={() => setMonthKey(addMonths(monthKey, 1))}
            className="w-11 h-11 flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={t("Next month")}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <ExpensesSkeleton />
        ) : (
          <>
            {/* Big centered total + yearly chart — a wide centered block per
                the direction contract, distinct from the full-width list
                below it. */}
            <div className="w-full max-w-3xl mx-auto mb-12">
              <div className="text-center mb-8">
                <p className="text-xs font-mono uppercase tracking-widest text-ink-faint mb-2">
                  {t("Total for")} {formatMonthKey(monthKey, locale)}
                </p>
                <p className="font-mono tabular-nums text-4xl sm:text-5xl font-bold text-negative tracking-tight">
                  {formatCurrency(animatedTotal)}
                </p>
                <p className="text-xs text-ink-muted mt-2">
                  {expenses.length} {t(expenses.length === 1 ? "expense" : "expenses")}
                </p>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="text-[11px] font-mono font-bold uppercase tracking-widest text-ink-faint">
                    {t("One-time expenses by month")}
                  </h2>
                  <span className="text-xs font-mono text-ink-faint tabular-nums">{year}</span>
                </div>
                <OneTimeExpenseChart data={yearlyTotals} highlightMonthKey={monthKey} t={t} />
              </div>
            </div>

            {/* View toggle */}
            <div className="w-full max-w-6xl mx-auto">
              <div
                className="flex bg-surface border border-hairline rounded-lg p-1 w-fit mb-4"
                role="group"
                aria-label={t("View mode")}
              >
                {(["category", "date", "amount"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    aria-pressed={viewMode === mode}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      viewMode === mode
                        ? "bg-surface-sunken text-ink"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {t(mode === "category" ? "Category" : mode === "date" ? "Date" : "Amount")}
                  </button>
                ))}
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag size={40} className="mx-auto mb-3 text-ink-faint" aria-hidden="true" />
                  <p className="font-semibold text-ink-muted">{t("No expenses for this month")}</p>
                  <p className="text-sm text-ink-faint mt-1">{t("Track your spending by adding expenses")}</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 flex items-center gap-2 mx-auto px-4 py-2.5 rounded-lg text-sm font-bold bg-accent hover:brightness-110 active:scale-[0.98] text-accent-contrast transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    <Plus size={16} aria-hidden="true" />
                    {t("Add First Expense")}
                  </button>
                </div>
              ) : viewMode === "amount" ? (
                <div className="border-t border-hairline divide-y divide-hairline">
                  {flatByAmount.map((expense) => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      showDate
                      showCategoryBadge
                      locale={locale}
                      onEdit={openEdit}
                      onDelete={setConfirmId}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-10 gap-y-8">
                  {groupedEntries.map(([groupKey, items]) => {
                    const catTotal = items.reduce((s, e) => s + e.amount, 0);
                    const style = getOneTimeCategoryStyle(groupKey);
                    return (
                      <div key={groupKey}>
                        <div className="flex items-center justify-between mb-2 px-0.5">
                          {viewMode === "category" ? (
                            <>
                              <span
                                className="text-xs font-mono font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: style.bg, color: style.text }}
                              >
                                {t(groupKey)}
                              </span>
                              <span className="text-xs font-mono text-ink-muted tabular-nums">
                                {t("Total:")}{" "}
                                <span className="text-ink font-semibold">{formatCurrency(catTotal)}</span>
                              </span>
                            </>
                          ) : (
                            <span className="text-xs font-mono font-semibold text-ink-muted tabular-nums">
                              {formatDate(groupKey, locale)}
                            </span>
                          )}
                        </div>
                        <div className="border-t border-hairline divide-y divide-hairline">
                          {items.map((expense) => (
                            <ExpenseRow
                              key={expense.id}
                              expense={expense}
                              showDate={viewMode === "category"}
                              showCategoryBadge={viewMode === "date"}
                              locale={locale}
                              onEdit={openEdit}
                              onDelete={setConfirmId}
                              t={t}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* RECURRING EXPENSES tab panel                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === "recurring" && (
        <div id="tabpanel-recurring" role="tabpanel" aria-labelledby="tab-recurring">
        <div className="w-full max-w-6xl mx-auto">
          {recurringLoading ? (
            <RecurringSkeleton />
          ) : (
            <>
              {/* Total — restyled but same figure as before */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-hairline rounded-lg px-5 py-4 mb-8">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-ink-faint mb-1">{t("Total monthly recurring")}</p>
                  <p className="font-mono tabular-nums text-3xl font-bold text-negative tracking-tight">
                    {formatCurrency(totalActive)}
                  </p>
                </div>
                <p className="text-xs text-ink-muted">
                  {activeExpenses.length} {t(activeExpenses.length === 1 ? "active expense" : "active expenses")}
                </p>
              </div>

              {recurring.length === 0 && (
                <div className="text-center py-16">
                  <RefreshCw size={40} className="mx-auto mb-3 text-ink-faint" aria-hidden="true" />
                  <p className="font-semibold text-ink-muted">{t("No recurring expenses yet")}</p>
                  <p className="text-sm text-ink-faint mt-1">{t("Add your bills, subscriptions, and fixed costs")}</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 flex items-center gap-2 mx-auto px-4 py-2.5 rounded-lg text-sm font-bold bg-accent hover:brightness-110 active:scale-[0.98] text-accent-contrast transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    <Plus size={16} aria-hidden="true" />
                    {t("Add First Expense")}
                  </button>
                </div>
              )}

              {activeExpenses.length > 0 && (
                <section aria-labelledby="section-active" className="mb-8">
                  <SectionHeader label={t("Active")} count={activeExpenses.length} t={t} />
                  <div className="border-t border-hairline divide-y divide-hairline">
                    {activeExpenses.map((e) => (
                      <RecurringRow key={e.id} expense={e} {...recRowProps} />
                    ))}
                  </div>
                </section>
              )}

              {concludedExpenses.length > 0 && (
                <section aria-labelledby="section-concluded" className="mb-8">
                  <SectionHeader label={t("Concluded")} count={concludedExpenses.length} t={t} />
                  <div className="border-t border-hairline divide-y divide-hairline">
                    {concludedExpenses.map((e) => (
                      <RecurringRow key={e.id} expense={e} {...recRowProps} paused />
                    ))}
                  </div>
                </section>
              )}

              {upcomingExpenses.length > 0 && (
                <section aria-labelledby="section-upcoming" className="mb-8">
                  <SectionHeader label={t("Upcoming")} count={upcomingExpenses.length} t={t} />
                  <div className="border-t border-hairline divide-y divide-hairline">
                    {upcomingExpenses.map((e) => (
                      <RecurringRow key={e.id} expense={e} {...recRowProps} upcoming />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
        </div>
      )}
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* Confirm dialogs                                                 */}
      {/* ══════════════════════════════════════════════════════════════ */}
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

      <AnimatePresence>
        {confirmRecId && (
          <ConfirmDialog
            message={t("This recurring expense will be permanently deleted. This action cannot be undone.")}
            onConfirm={() => handleDeleteRecurring(confirmRecId)}
            onCancel={() => setConfirmRecId(null)}
            reduceMotion={reduceMotion}
          />
        )}
        {concludeCandidate && (
          <ConfirmDialog
            title={t("Confirm Concluding")}
            confirmLabel={t("Conclude")}
            message={t("Conclude this recurring expense? It will stop applying from the next month.")}
            onConfirm={() => handleConclude(concludeCandidate)}
            onCancel={() => setConcludeCandidate(null)}
            reduceMotion={reduceMotion}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* Modals                                                          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* Unified add — the single "Add Expense" entry point for both      */}
      {/* one-time and recurring; see UnifiedAddExpenseForm above.         */}
      {showAddModal && (
        <Modal
          title={t("Add Expense")}
          onClose={() => setShowAddModal(false)}
        >
          <UnifiedAddExpenseForm
            onSave={handleAddSaved}
            onClose={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {/* Edit flows stay dedicated per kind — they carry fields (apply-from
          month, end month, etc.) that don't fit a shared add form. */}
      {showModal && (
        <Modal
          title={t("Edit Expense")}
          onClose={closeModal}
        >
          <ExpenseForm
            existing={editing}
            onSave={() => setRefresh((r) => r + 1)}
            onClose={closeModal}
          />
        </Modal>
      )}

      {showRecModal && (
        <Modal
          title={t("Edit Recurring Expense")}
          onClose={closeRecModal}
        >
          <RecurringExpenseForm
            existing={editingRec}
            onSave={() => setRecRefresh((r) => r + 1)}
            onClose={closeRecModal}
          />
        </Modal>
      )}

      {showRecurringModal && (
        <RecurringApplyModal
          monthKey={monthKey}
          onClose={() => { setShowRecurringModal(false); setRefresh((r) => r + 1); }}
          onApplied={() => { setRefresh((r) => r + 1); setRecRefresh((r) => r + 1); }}
        />
      )}
    </div>
  );
}
