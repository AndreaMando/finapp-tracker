"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Landmark, ChevronDown, Pencil, PiggyBank } from "lucide-react";
import {
  formatMonthKey,
  formatDate,
  getInstallmentPlans,
  addInstallmentPlan,
  deleteInstallmentPlan,
  deletePlanRevision,
  type InstallmentPlan,
} from "@/lib/store";
import { installmentSlot, MIN_INSTALLMENTS, MAX_INSTALLMENTS } from "@/lib/installment-math";
import { summarizeMortgage, debtCurve, buildMortgageModel } from "@/lib/mortgage-math";
import { EditMortgageForm, ExtraPaymentForm } from "@/components/MortgageForms";
import { MortgageDebtChart } from "@/components/MortgageDebtChart";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useTranslation } from "@/lib/i18n";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-sunken rounded-md animate-pulse ${className}`} aria-hidden="true" />;
}

function Kpi({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "positive" | "negative" }) {
  const toneClass = tone === "positive" ? "text-accent" : tone === "negative" ? "text-negative" : "text-ink";
  return (
    <div className="bg-surface px-4 sm:px-5 py-4 min-w-0">
      <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-ink-faint leading-snug">{label}</p>
      <p className={`mt-1.5 text-sm sm:text-lg font-mono font-bold tabular-nums break-words ${toneClass}`}>{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Add form (modal)
// ─────────────────────────────────────────────
function AddMortgageForm({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [name, setName] = useState("");
  const [payment, setPayment] = useState("");
  const [count, setCount] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [capital, setCapital] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const parsedPayment = parseFloat(payment);
  const parsedCount = Number(count);
  const parsedCapital = capital.trim() === "" ? null : parseFloat(capital);
  const countValid = count.trim() !== "" && Number.isInteger(parsedCount) && parsedCount >= MIN_INSTALLMENTS && parsedCount <= MAX_INSTALLMENTS;

  let summary = "";
  if (countValid && !isNaN(parsedPayment) && parsedPayment > 0 && startDate) {
    try {
      const last = installmentSlot(startDate, parsedCount);
      summary = `${parsedCount} × ${formatCurrency(parsedPayment)} = ${formatCurrency(parsedPayment * parsedCount)} · ${t("Last installment:")} ${formatMonthKey(last.monthKey, locale)}`;
    } catch {
      summary = "";
    }
  }

  function clear(field: string) {
    setErrors((p) => ({ ...p, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t("Name is required.");
    if (isNaN(parsedPayment) || parsedPayment <= 0) errs.payment = t("Enter a valid amount.");
    if (!countValid) errs.count = t("Enter a valid number of installments (2-360).");
    if (!startDate) errs.startDate = t("Date is required.");
    if (parsedCapital !== null && (isNaN(parsedCapital) || parsedCapital <= 0)) errs.capital = t("Enter a valid amount.");
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.name) nameRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await addInstallmentPlan(name.trim(), parsedPayment, "Mortgage", startDate, parsedCount, {
        kind: "mortgage",
        financedAmount: parsedCapital,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("An error occurred. Please try again."));
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    onSave();
    onClose();
  }

  const labelClass = "block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase";
  const inputClass =
    "block w-full min-w-0 px-4 py-3 text-sm text-ink bg-surface-sunken border border-hairline rounded-lg placeholder-ink-faint transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent";
  const numberClass = `${inputClass} font-mono tabular-nums [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:none]`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="mortgage-name" className={labelClass}>
          {t("Mortgage name")} <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          ref={nameRef}
          id="mortgage-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); clear("name"); }}
          placeholder={t("e.g. Home mortgage")}
          aria-invalid={errors.name ? "true" : undefined}
          autoFocus
          className={inputClass}
        />
        {errors.name && <p role="alert" className="text-[11px] text-negative mt-1">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="mortgage-payment" className={labelClass}>
          {t("Monthly payment")} (€) <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="mortgage-payment"
          type="number"
          step="0.01"
          min="0"
          value={payment}
          onChange={(e) => { setPayment(e.target.value); clear("payment"); }}
          placeholder="0.00"
          aria-invalid={errors.payment ? "true" : undefined}
          className={numberClass}
        />
        {errors.payment && <p role="alert" className="text-[11px] text-negative mt-1">{errors.payment}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="mortgage-count" className={labelClass}>
          {t("Number of installments")} <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="mortgage-count"
          type="number"
          inputMode="numeric"
          step="1"
          min={MIN_INSTALLMENTS}
          max={MAX_INSTALLMENTS}
          value={count}
          onChange={(e) => { setCount(e.target.value); clear("count"); }}
          placeholder="240"
          aria-invalid={errors.count ? "true" : undefined}
          className={numberClass}
        />
        {errors.count && <p role="alert" className="text-[11px] text-negative mt-1">{errors.count}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="mortgage-start" className={labelClass}>
          {t("First payment date")} <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="mortgage-start"
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); clear("startDate"); }}
          aria-invalid={errors.startDate ? "true" : undefined}
          className={`${inputClass} font-mono cursor-pointer`}
        />
        {errors.startDate && <p role="alert" className="text-[11px] text-negative mt-1">{errors.startDate}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="mortgage-capital" className={labelClass}>
          {t("Borrowed capital (optional)")} (€)
        </label>
        <input
          id="mortgage-capital"
          type="number"
          step="0.01"
          min="0"
          value={capital}
          onChange={(e) => { setCapital(e.target.value); clear("capital"); }}
          placeholder="0.00"
          aria-invalid={errors.capital ? "true" : undefined}
          aria-describedby="mortgage-capital-hint"
          className={numberClass}
        />
        <p id="mortgage-capital-hint" className="text-[11px] text-ink-faint">
          {t("Used to estimate the interest rate and the capital/interest split")}
        </p>
        {errors.capital && <p role="alert" className="text-[11px] text-negative mt-1">{errors.capital}</p>}
      </div>

      {summary && <p className="text-xs text-ink-muted font-mono tabular-nums" aria-live="polite">{summary}</p>}
      {submitError && <ErrorBanner message={submitError} />}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="flex-1 py-3 rounded-lg text-sm font-bold bg-accent hover:brightness-110 active:scale-[0.98] text-accent-contrast transition-all cursor-pointer disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {t("Add Mortgage")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-lg text-sm font-semibold bg-surface-sunken hover:bg-hairline text-ink active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t("Cancel")}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// One mortgage — progress, figures, debt curve, optional amortization schedule
// ─────────────────────────────────────────────
function MortgageSection({
  plan,
  locale,
  onDelete,
  onEdit,
  onExtra,
  onRemoveRevision,
}: {
  plan: InstallmentPlan;
  locale: string;
  onDelete: (id: string) => void;
  onEdit: (plan: InstallmentPlan) => void;
  onExtra: (plan: InstallmentPlan) => void;
  onRemoveRevision: (plan: InstallmentPlan, revisionId: string) => void;
}) {
  const { t } = useTranslation();
  const [showSchedule, setShowSchedule] = useState(false);

  const capital = plan.financedAmount;
  const input = useMemo(
    () => ({ payment: plan.amount, count: plan.totalInstallments, capital, revisions: plan.revisions }),
    [plan.amount, plan.totalInstallments, capital, plan.revisions]
  );
  const model = useMemo(() => buildMortgageModel(input), [input]);
  // The plan as it stands now: later changes can shorten or lengthen it.
  const count = model.rows.length;
  const paid = Math.min(plan.generatedCount, count);

  const summary = useMemo(() => summarizeMortgage({ ...input, paid }), [input, paid]);
  const curve = useMemo(() => debtCurve(input), [input]);
  const schedule = capital ? model.rows : [];
  // Payment currently in force: the next installment's, or the last one once finished.
  const currentPayment = model.rows[Math.min(paid, count - 1)]?.payment ?? plan.amount;
  const history = useMemo(
    () => [...plan.revisions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [plan.revisions]
  );

  const first = installmentSlot(plan.startDate, 1);
  const last = installmentSlot(plan.startDate, Math.max(1, count));
  const completed = paid >= count;
  const hasEstimate = capital !== null && summary.monthlyRate !== null;

  return (
    <section className="p-6 lg:p-8 space-y-6" aria-labelledby={`mortgage-${plan.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={`mortgage-${plan.id}`} className="text-lg font-bold text-ink tracking-tight truncate">{plan.name}</h2>
          <p className="text-xs font-mono text-ink-faint tabular-nums mt-0.5">
            {t("Started:")} {formatDate(plan.startDate, locale)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onExtra(plan)}
            className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-bold text-ink bg-surface border border-hairline hover:bg-surface-sunken active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <PiggyBank size={14} aria-hidden="true" />
            {t("Add prepayment")}
          </button>
          <button
            onClick={() => onExtra(plan)}
            aria-label={`${t("Add prepayment")} ${plan.name}`}
            title={t("Add prepayment")}
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg text-ink-faint hover:text-accent hover:bg-accent/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <PiggyBank size={14} aria-hidden="true" />
          </button>
          <button
            onClick={() => onEdit(plan)}
            aria-label={`${t("Edit")} ${plan.name}`}
            title={t("Edit")}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-faint hover:text-accent hover:bg-accent/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            aria-label={`${t("Delete")} ${plan.name}`}
            title={t("Delete")}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-faint hover:text-negative hover:bg-negative/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-negative"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2 text-sm">
          <span className="font-mono font-semibold text-ink tabular-nums">
            {completed ? t("Payment completed") : `${t("Installment")} ${paid}/${count}`}
          </span>
          <span className="font-mono font-semibold text-accent tabular-nums">{formatPercent(summary.progress)}</span>
        </div>
        <div
          className="h-2 rounded-full bg-surface-sunken overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(summary.progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${plan.name}: ${formatPercent(summary.progress, 0)}`}
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, summary.progress * 100)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-px bg-hairline border border-hairline rounded-lg overflow-hidden">
        <Kpi label={t("Monthly payment")} value={formatCurrency(currentPayment)} />
        <Kpi label={t("Paid so far")} value={formatCurrency(summary.paidAmount)} />
        <Kpi label={t("Remaining to pay")} value={formatCurrency(summary.remainingToPay)} tone="negative" />
        <Kpi label={t("Total to pay")} value={formatCurrency(summary.totalToPay)} />
        <Kpi label={t("Expected end")} value={formatMonthKey(last.monthKey, locale)} />
        {hasEstimate && (
          <>
            <Kpi label={t("Capital repaid")} value={formatCurrency(summary.capitalRepaid ?? 0)} tone="positive" />
            <Kpi label={t("Capital remaining")} value={formatCurrency(summary.capitalRemaining ?? 0)} />
            <Kpi label={t("Interest paid (est.)")} value={formatCurrency(summary.interestPaid ?? 0)} />
            <Kpi label={t("Total interest (est.)")} value={formatCurrency(summary.interestTotal ?? 0)} />
            <Kpi label={t("Estimated annual rate")} value={formatPercent(summary.annualRate ?? 0, 2)} />
          </>
        )}
      </div>

      <div>
        <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-ink-faint mb-3">
          {t("Debt over time")}
        </h3>
        <MortgageDebtChart
          points={curve}
          paid={paid}
          startLabel={formatMonthKey(first.monthKey, locale)}
          endLabel={formatMonthKey(last.monthKey, locale)}
          maxLabel={formatCurrency(curve[0]?.debt ?? 0)}
          ariaLabel={`${t("Debt over time")}: ${plan.name}`}
          legendPaid={t("Already paid")}
          legendProjected={t("Projected")}
          className="h-44 sm:h-60"
        />
      </div>

      {hasEstimate && (
        <div>
          <button
            type="button"
            onClick={() => setShowSchedule((v) => !v)}
            aria-expanded={showSchedule}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            {showSchedule ? t("Hide schedule") : t("Show schedule")}
            <ChevronDown size={13} aria-hidden="true" className={`transition-transform ${showSchedule ? "rotate-180" : ""}`} />
          </button>
          {showSchedule && (
            <div className="mt-3 max-h-80 overflow-auto border border-hairline rounded-lg">
              <table className="w-full text-xs font-mono tabular-nums">
                <caption className="sr-only">{t("Amortization schedule")}</caption>
                <thead className="sticky top-0 bg-surface-sunken text-ink-faint uppercase tracking-wide">
                  <tr>
                    <th scope="col" className="text-left font-semibold px-3 py-2">{t("No.")}</th>
                    <th scope="col" className="text-left font-semibold px-3 py-2">{t("Date")}</th>
                    <th scope="col" className="text-right font-semibold px-3 py-2">{t("Capital")}</th>
                    <th scope="col" className="text-right font-semibold px-3 py-2">{t("Interest")}</th>
                    <th scope="col" className="text-right font-semibold px-3 py-2">{t("Balance")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {schedule.map((row) => (
                    <tr key={row.n} className={row.n <= paid ? "text-ink-muted" : "text-ink"}>
                      <td className="px-3 py-1.5">{row.n}</td>
                      <td className="px-3 py-1.5">{formatDate(installmentSlot(plan.startDate, row.n).isoDate, locale)}</td>
                      <td className="px-3 py-1.5 text-right">{formatCurrency(row.capitalPart ?? 0)}</td>
                      <td className="px-3 py-1.5 text-right">{formatCurrency(row.interestPart ?? 0)}</td>
                      <td className="px-3 py-1.5 text-right">{formatCurrency(row.balance ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-ink-faint mb-3">
            {t("Changes")}
          </h3>
          <ul className="divide-y divide-hairline border-y border-hairline">
            {history.map((r) => {
              const slot = installmentSlot(plan.startDate, Math.max(1, r.fromInstallment));
              // A change that already applies to recorded installments is history and can't be undone.
              const applied = r.fromInstallment <= paid;
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="text-ink truncate">
                      {r.kind === "extra"
                        ? `${t("Prepayment")}: ${formatCurrency(r.extraAmount ?? 0)}${r.extraDate ? ` · ${formatDate(r.extraDate, locale)}` : ""}`
                        : t("Payment recalculated")}
                    </p>
                    <p className="text-xs font-mono text-ink-faint tabular-nums">
                      {formatCurrency(r.payment)} · {r.totalInstallments} {t("installments")} · {t("from")} {formatMonthKey(slot.monthKey, locale)}
                    </p>
                  </div>
                  {!applied && (
                    <button
                      onClick={() => onRemoveRevision(plan, r.id)}
                      aria-label={`${t("Delete")} ${r.kind === "extra" ? t("Prepayment") : t("Payment recalculated")}`}
                      title={t("Delete")}
                      className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-ink-faint hover:text-negative hover:bg-negative/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-negative"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {hasEstimate && (
        <p className="text-xs text-ink-faint">
          {t("Estimates assume a fixed rate between changes; they drift if your rate varies in between.")}
        </p>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function MortgagePage() {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const reduceMotion = useReducedMotion() ?? false;

  const [mortgages, setMortgages] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editing, setEditing] = useState<InstallmentPlan | null>(null);
  const [extraFor, setExtraFor] = useState<InstallmentPlan | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getInstallmentPlans();
        if (!cancelled) setMortgages(data.filter((p) => p.kind === "mortgage"));
      } catch {
        if (!cancelled) setError(t("An error occurred. Please try again."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  async function handleRemoveRevision(plan: InstallmentPlan, revisionId: string) {
    try {
      await deletePlanRevision(plan.id, revisionId);
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("An error occurred. Please try again."));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteInstallmentPlan(id);
      setConfirmId(null);
      setRefresh((r) => r + 1);
    } catch (err) {
      setConfirmId(null);
      setError(err instanceof Error ? err.message : t("An error occurred. Please try again."));
    }
  }

  return (
    <div className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
      <div className="bg-surface border border-hairline rounded-lg overflow-hidden divide-y divide-hairline">
        <section className="p-6 lg:p-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:opacity-80 transition-opacity mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              <ArrowLeft size={13} aria-hidden="true" /> {t("Back to dashboard")}
            </Link>
            <h1 className="text-2xl font-bold text-ink tracking-tight">{t("Mortgage")}</h1>
            <p className="text-sm text-ink-muted mt-0.5">{t("Follow your mortgage over time")}</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-accent hover:brightness-110 active:scale-[0.98] text-accent-contrast transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Plus size={16} aria-hidden="true" />
            {t("Add Mortgage")}
          </button>
        </section>

        {error && (
          <div className="p-6 lg:p-8">
            <ErrorBanner message={error} />
          </div>
        )}

        {loading ? (
          <div className="p-6 lg:p-8 space-y-4" aria-busy="true">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : mortgages.length === 0 ? (
          <section className="p-6 lg:p-8 text-center py-16">
            <Landmark size={40} className="mx-auto mb-3 text-ink-faint" aria-hidden="true" />
            <p className="font-semibold text-ink-muted">{t("No mortgage yet")}</p>
            <p className="text-sm text-ink-faint mt-1">
              {t("Add your mortgage to follow what you have repaid and what is left over time")}
            </p>
          </section>
        ) : (
          mortgages.map((m) => (
            <MortgageSection
              key={m.id}
              plan={m}
              locale={locale}
              onDelete={setConfirmId}
              onEdit={setEditing}
              onExtra={setExtraFor}
              onRemoveRevision={handleRemoveRevision}
            />
          ))
        )}
      </div>

      {showAdd && (
        <Modal title={t("Add Mortgage")} onClose={() => setShowAdd(false)}>
          <AddMortgageForm onSave={() => setRefresh((r) => r + 1)} onClose={() => setShowAdd(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title={t("Edit Mortgage")} onClose={() => setEditing(null)}>
          <EditMortgageForm plan={editing} onSaved={() => setRefresh((r) => r + 1)} onClose={() => setEditing(null)} />
        </Modal>
      )}

      {extraFor && (
        <Modal title={t("Add prepayment")} onClose={() => setExtraFor(null)}>
          <ExtraPaymentForm plan={extraFor} onSaved={() => setRefresh((r) => r + 1)} onClose={() => setExtraFor(null)} />
        </Modal>
      )}

      <AnimatePresence>
        {confirmId && (
          <ConfirmDialog
            message={t("This mortgage will be deleted. Payments already recorded stay in your expenses; the remaining ones will no longer be recorded.")}
            onConfirm={() => handleDelete(confirmId)}
            onCancel={() => setConfirmId(null)}
            reduceMotion={reduceMotion}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
