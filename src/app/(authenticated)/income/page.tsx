"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useReducedMotion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, TrendingUp, BarChart3 } from "lucide-react";
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
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

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
// Yearly income chart — hand-rolled inline SVG, no charting library.
// Every month of the current calendar year is plotted (months with no
// entry render as a €0-height bar rather than being skipped), and the
// real current month is highlighted so "where am I now" reads at a glance.
// ─────────────────────────────────────────────
interface MonthDatum {
  monthIndex: number; // 0-11
  monthKey: string;
  amount: number;
  isCurrent: boolean;
}

function buildYearData(incomes: MonthlyIncome[], year: number, highlightMonthKey: string): MonthDatum[] {
  return Array.from({ length: 12 }, (_, i) => {
    const mk = `${year}-${String(i + 1).padStart(2, "0")}`;
    const found = incomes.find((inc) => inc.monthKey === mk);
    return { monthIndex: i, monthKey: mk, amount: found?.amount ?? 0, isCurrent: mk === highlightMonthKey };
  });
}

function YearlyIncomeChart({ data, year, locale, t }: { data: MonthDatum[]; year: number; locale: string; t: (k: string) => string }) {
  const W = 600;
  const H = 200;
  const marginX = 6;
  const baselineY = 168;
  const maxBarHeight = 150;
  const slot = (W - marginX * 2) / 12;
  const barWidth = slot * 0.62;

  const max = Math.max(...data.map((d) => d.amount), 0);

  const monthLong = (idx: number) => new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(year, idx, 1));
  const monthShort = (idx: number) => new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(year, idx, 1));

  const ariaLabel = `${t("Income by Month")} ${year}. ${data
    .map((d) => `${monthLong(d.monthIndex)}: ${formatCurrency(d.amount)}${d.isCurrent ? ` — ${t("Current month")}` : ""}`)
    .join("; ")}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
    >
      <line x1={marginX} y1={baselineY} x2={W - marginX} y2={baselineY} className="stroke-hairline" strokeWidth="1" />
      {data.map((d) => {
        const x = marginX + d.monthIndex * slot + (slot - barWidth) / 2;
        const barHeight = max > 0 ? (d.amount / max) * maxBarHeight : 0;
        const y = baselineY - barHeight;
        const labelX = x + barWidth / 2;
        return (
          <g key={d.monthKey}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="2"
              className={d.isCurrent ? "fill-accent" : "fill-accent/25"}
            >
              <title>{`${monthLong(d.monthIndex)}: ${formatCurrency(d.amount)}`}</title>
            </rect>
            {d.isCurrent && (
              <circle cx={labelX} cy={y - 8} r="3" className="fill-accent" aria-hidden="true" />
            )}
            <text
              x={labelX}
              y={H - 6}
              textAnchor="middle"
              className={`text-[10px] font-mono ${d.isCurrent ? "fill-ink font-semibold" : "fill-ink-faint"}`}
            >
              {monthShort(d.monthIndex)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// P3: Skeleton
// ─────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-sunken rounded-lg animate-pulse ${className}`} aria-hidden="true" />;
}

function IncomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Caricamento entrate...">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface border border-hairline rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
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
        <div className="bg-surface border border-hairline rounded-lg p-6 space-y-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
      <Skeleton className="h-4 w-28 mb-3" />
      <div className="bg-surface border border-hairline rounded-lg divide-y divide-hairline overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="px-6 py-4 flex justify-between items-center">
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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

      {/* Month (read-only) */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Month")}
        </p>
        <p className="text-sm font-mono tabular-nums text-ink bg-surface-sunken border border-hairline rounded-lg px-4 py-3 flex items-center">
          {formatMonthKey(monthKey, locale)}
        </p>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label htmlFor="income-amount" className="block text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Amount")} (€) <span className="text-accent" aria-hidden="true">*</span>
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
          className="block w-full px-4 py-3 text-sm font-mono tabular-nums text-ink bg-surface-sunken border border-hairline rounded-lg
                     placeholder-ink-faint transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
                     [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {error && (
          <p id="income-amount-error" role="alert" className="text-[11px] text-negative mt-1">{error}</p>
        )}
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label htmlFor="income-note" className="block text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Note (optional)")}
        </label>
        <input
          id="income-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("e.g. Salary + bonus")}
          className="block w-full px-4 py-3 text-sm text-ink bg-surface-sunken border border-hairline rounded-lg
                     placeholder-ink-faint transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit" disabled={isSubmitting} aria-busy={isSubmitting}
          className="flex-1 py-3 rounded-lg text-sm font-semibold bg-accent hover:opacity-90 active:scale-[0.98] text-accent-contrast
                     transition-all cursor-pointer disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {existing ? t("Update Income") : t("Save Income")}
        </button>
        <button
          type="button" onClick={onClose}
          className="flex-1 py-3 rounded-lg text-sm font-semibold bg-surface-sunken hover:bg-hairline active:scale-[0.98] text-ink
                     transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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
  const [actionError, setActionError] = useState("");

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

  // Both the chart's year and its highlighted bar follow the month the user
  // is actually viewing (monthKey), not today's real date — matching the
  // Expenses page's equivalent chart. Browsing to a different year shows
  // that year's data with no bar highlighted, not last year's real "today".
  const currentYear = Number(monthKey.split("-")[0]);
  const yearData = useMemo(
    () => buildYearData(allIncomes, currentYear, monthKey),
    [allIncomes, currentYear, monthKey]
  );

  async function handleDelete(id: string) {
    try {
      await deleteIncome(id);
      setConfirmId(null);
      setRefresh((r) => r + 1);
    } catch (err) {
      setConfirmId(null);
      setActionError(err instanceof Error ? err.message : t("An error occurred. Please try again."));
    }
  }

  return (
    <div className="flex-1 p-6 lg:p-8 w-full mx-auto max-w-[1600px]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">{t("Income")}</h1>
          <p className="text-sm text-ink-muted mt-0.5">{t("Record your monthly earnings")}</p>
        </div>
        {/* P2: 44px touch target */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-accent hover:opacity-90 active:scale-[0.98] text-accent-contrast transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg w-fit"
          aria-label={t("Set Income")}
        >
          <Plus size={16} aria-hidden="true" />
          {t("Set Income")}
        </button>
      </div>

      {/* Month selector */}
      <div
        className="flex items-center gap-1 bg-surface-sunken border border-hairline rounded-lg px-2 py-1 w-fit mb-6"
        role="group"
        aria-label={t("Month navigation")}
      >
        <button
          onClick={() => setMonthKey(addMonths(monthKey, -1))}
          aria-label={t("Previous month")}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-hairline/50 transition-colors cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span
          className="text-sm font-semibold text-ink min-w-[120px] text-center font-mono tabular-nums select-none"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatMonthKey(monthKey, locale)}
        </span>
        <button
          onClick={() => setMonthKey(addMonths(monthKey, 1))}
          aria-label={t("Next month")}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-hairline/50 transition-colors cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      {/* P3: skeleton */}
      {loading ? (
        <IncomeSkeleton />
      ) : (
        <>
          {/* Current month figure + yearly chart, side by side on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* Current month card */}
            <div className="bg-surface border border-hairline rounded-lg p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0" aria-hidden="true">
                  <TrendingUp size={20} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs text-ink-muted">{t("Income for")}</p>
                  <p className="font-semibold text-ink text-sm">{formatMonthKey(monthKey, locale)}</p>
                </div>
              </div>

              {currentIncome ? (
                <div>
                  <p className="text-4xl font-mono font-bold tabular-nums tracking-tight text-accent">
                    {formatCurrency(currentIncome.amount)}
                  </p>
                  {currentIncome.note && (
                    <p className="text-sm text-ink-muted mt-1.5">{currentIncome.note}</p>
                  )}
                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => setShowModal(true)}
                      aria-label={t("Edit income for this month")}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-surface-sunken hover:bg-hairline active:scale-[0.98] text-ink-muted hover:text-ink transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      <Pencil size={14} aria-hidden="true" />
                      {t("Edit")}
                    </button>
                    <button
                      onClick={() => setConfirmId(currentIncome.id)}
                      aria-label={t("Delete income for this month")}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-negative/10 hover:bg-negative/20 active:scale-[0.98] text-negative transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-negative focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      {t("Delete")}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-ink-muted">{t("No income recorded for this month.")}</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-3 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-surface-sunken hover:bg-hairline active:scale-[0.98] text-accent transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  >
                    <Plus size={14} aria-hidden="true" />
                    {t("Add Income")}
                  </button>
                </div>
              )}
            </div>

            {/* Yearly chart card */}
            <div className="bg-surface border border-hairline rounded-lg p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0" aria-hidden="true">
                    <BarChart3 size={20} className="text-accent" />
                  </div>
                  <p className="font-semibold text-ink text-sm">{t("Income by Month")}</p>
                </div>
                <span className="font-mono text-xs text-ink-faint tabular-nums">{currentYear}</span>
              </div>
              <YearlyIncomeChart data={yearData} year={currentYear} locale={locale} t={t} />
            </div>
          </div>

          {/* History — given real room across the full width */}
          <section aria-labelledby="income-history-heading" className="bg-surface border border-hairline rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-hairline">
              <h2 id="income-history-heading" className="text-sm font-semibold text-ink">
                {t("Income History")}
              </h2>
            </div>

            {allIncomes.length === 0 ? (
              <p className="px-6 py-8 text-sm text-ink-muted">{t("No income entries yet.")}</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {allIncomes.map((income) => (
                  <li
                    key={income.id}
                    className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-surface-sunken transition-colors"
                  >
                    <div className="min-w-0 flex items-baseline gap-3">
                      <span className="font-medium text-ink shrink-0">
                        {formatMonthKey(income.monthKey, locale)}
                      </span>
                      {income.note && (
                        <span className="text-xs text-ink-muted truncate">{income.note}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-semibold text-accent tabular-nums">
                        {formatCurrency(income.amount)}
                      </span>
                      {/* P2: 36×36 touch target */}
                      <button
                        onClick={() => setConfirmId(income.id)}
                        aria-label={`${t("Delete income for")} ${formatMonthKey(income.monthKey, locale)}`}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-faint hover:text-negative hover:bg-negative/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-negative"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
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
