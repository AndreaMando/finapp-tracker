"use client";

import { useMemo, useState } from "react";
import {
  updateInstallmentPlan,
  addMortgageExtraPayment,
  formatMonthKey,
  type InstallmentPlan,
} from "@/lib/store";
import {
  MAX_INSTALLMENTS,
  MIN_INSTALLMENTS,
  currentTerms,
  installmentIndexForMonth,
  installmentSlot,
  installmentsPaidBy,
  termsAt,
} from "@/lib/installment-math";
import { proposeExtraPayment } from "@/lib/mortgage-math";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useTranslation } from "@/lib/i18n";

const labelClass = "block text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase";
const inputClass =
  "block w-full min-w-0 px-4 py-3 text-sm text-ink bg-surface-sunken border border-hairline rounded-lg placeholder-ink-faint transition-all focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent";
const numberClass = `${inputClass} font-mono tabular-nums [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:none]`;
const dateClass = `${inputClass} font-mono cursor-pointer`;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(amount);
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function FormButtons({ submitting, submitLabel, onClose }: { submitting: boolean; submitLabel: string; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2 pt-2">
      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        className="flex-1 py-3 rounded-lg text-sm font-bold bg-accent hover:brightness-110 active:scale-[0.98] text-accent-contrast transition-all cursor-pointer disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {submitLabel}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-3 rounded-lg text-sm font-semibold bg-surface-sunken hover:bg-hairline text-ink active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {t("Cancel")}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Edit a mortgage. Name and borrowed capital can always change (the capital can
// be added later, once known). A new payment / number of installments — what
// happens when a variable-rate mortgage is recalculated — applies from a chosen
// month on; installments already recorded are never rewritten. The start date
// is only editable while nothing has been recorded.
// ─────────────────────────────────────────────
export function EditMortgageForm({
  plan,
  onSaved,
  onClose,
}: {
  plan: InstallmentPlan;
  onSaved: () => void;
  onClose: () => void;
}) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";

  const base = { payment: plan.amount, total: plan.totalInstallments };
  const terms = currentTerms(base, plan.revisions);
  const generated = plan.generatedCount;
  const nextIndex = Math.min(generated + 1, terms.total);
  const nextPayment = termsAt(base, plan.revisions, nextIndex).payment;
  const minMonth = installmentSlot(plan.startDate, nextIndex).monthKey;
  const startLocked = generated > 0 || plan.revisions.length > 0;

  const [name, setName] = useState(plan.name);
  const [capital, setCapital] = useState(plan.financedAmount !== null ? String(plan.financedAmount) : "");
  const [startDate, setStartDate] = useState(plan.startDate);
  const [payment, setPayment] = useState(String(nextPayment));
  const [count, setCount] = useState(String(terms.total));
  const [fromMonth, setFromMonth] = useState(minMonth);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const parsedPayment = parseFloat(payment);
  const parsedCount = Number(count);
  const parsedCapital = capital.trim() === "" ? null : parseFloat(capital);
  const termsChanged =
    !isNaN(parsedPayment) && (Math.abs(parsedPayment - nextPayment) > 0.004 || parsedCount !== terms.total);

  function clear(field: string) {
    setErrors((p) => ({ ...p, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t("Name is required.");
    if (parsedCapital !== null && (isNaN(parsedCapital) || parsedCapital <= 0)) errs.capital = t("Enter a valid amount.");
    if (isNaN(parsedPayment) || parsedPayment <= 0) errs.payment = t("Enter a valid amount.");
    if (
      !Number.isInteger(parsedCount) ||
      parsedCount < Math.max(MIN_INSTALLMENTS, generated) ||
      parsedCount > MAX_INSTALLMENTS
    ) {
      errs.count = t("Enter a valid number of installments (2-360).");
    }
    if (termsChanged && !fromMonth) errs.fromMonth = t("Date is required.");
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const changes: Parameters<typeof updateInstallmentPlan>[1] = {};
    if (name.trim() !== plan.name) changes.name = name.trim();
    if (parsedCapital !== plan.financedAmount) changes.financedAmount = parsedCapital;
    if (!startLocked && startDate !== plan.startDate) changes.startDate = startDate;
    if (termsChanged) {
      // A change can only start after the installments that are already recorded.
      const from = Math.max(installmentIndexForMonth(plan.startDate, fromMonth), generated + 1);
      changes.revision = { payment: parsedPayment, totalInstallments: parsedCount, fromInstallment: from };
    }
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await updateInstallmentPlan(plan.id, changes);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("An error occurred. Please try again."));
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    onSaved();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="edit-mortgage-name" className={labelClass}>
          {t("Mortgage name")} <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="edit-mortgage-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); clear("name"); }}
          aria-invalid={errors.name ? "true" : undefined}
          className={inputClass}
        />
        {errors.name && <p role="alert" className="text-[11px] text-negative mt-1">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-mortgage-capital" className={labelClass}>
          {t("Borrowed capital (optional)")} (€)
        </label>
        <input
          id="edit-mortgage-capital"
          type="number"
          step="0.01"
          min="0"
          value={capital}
          onChange={(e) => { setCapital(e.target.value); clear("capital"); }}
          placeholder="0.00"
          aria-invalid={errors.capital ? "true" : undefined}
          aria-describedby="edit-mortgage-capital-hint"
          className={numberClass}
        />
        <p id="edit-mortgage-capital-hint" className="text-[11px] text-ink-faint">
          {t("Used to estimate the interest rate and the capital/interest split")}
        </p>
        {errors.capital && <p role="alert" className="text-[11px] text-negative mt-1">{errors.capital}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-mortgage-start" className={labelClass}>{t("First payment date")}</label>
        <input
          id="edit-mortgage-start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={startLocked}
          aria-describedby={startLocked ? "edit-mortgage-start-hint" : undefined}
          className={`${dateClass} disabled:opacity-60 disabled:cursor-not-allowed`}
        />
        {startLocked && (
          <p id="edit-mortgage-start-hint" className="text-[11px] text-ink-faint">
            {t("The first payment date cannot change once installments are recorded")}
          </p>
        )}
      </div>

      <fieldset className="space-y-4 border border-hairline rounded-lg p-4">
        <legend className="px-1 text-[11px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Payment and duration")}
        </legend>
        <p className="text-xs text-ink-muted -mt-1">
          {t("If the bank recalculated your payment, enter the new figures and the month they apply from. Installments already recorded stay as they are.")}
        </p>

        <div className="space-y-1.5">
          <label htmlFor="edit-mortgage-payment" className={labelClass}>{t("Monthly payment")} (€)</label>
          <input
            id="edit-mortgage-payment"
            type="number"
            step="0.01"
            min="0"
            value={payment}
            onChange={(e) => { setPayment(e.target.value); clear("payment"); }}
            aria-invalid={errors.payment ? "true" : undefined}
            className={numberClass}
          />
          {errors.payment && <p role="alert" className="text-[11px] text-negative mt-1">{errors.payment}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-mortgage-count" className={labelClass}>{t("Number of installments")}</label>
          <input
            id="edit-mortgage-count"
            type="number"
            inputMode="numeric"
            step="1"
            min={Math.max(MIN_INSTALLMENTS, generated)}
            max={MAX_INSTALLMENTS}
            value={count}
            onChange={(e) => { setCount(e.target.value); clear("count"); }}
            aria-invalid={errors.count ? "true" : undefined}
            className={numberClass}
          />
          {errors.count && <p role="alert" className="text-[11px] text-negative mt-1">{errors.count}</p>}
        </div>

        {termsChanged && (
          <div className="space-y-1.5">
            <label htmlFor="edit-mortgage-from" className={labelClass}>{t("Apply from")}</label>
            <input
              id="edit-mortgage-from"
              type="month"
              min={minMonth}
              value={fromMonth}
              onChange={(e) => { setFromMonth(e.target.value); clear("fromMonth"); }}
              aria-invalid={errors.fromMonth ? "true" : undefined}
              className={`${dateClass} capitalize`}
            />
            <p className="text-[11px] text-ink-faint">
              {t("Earliest")}: {formatMonthKey(minMonth, locale)}
            </p>
            {errors.fromMonth && <p role="alert" className="text-[11px] text-negative mt-1">{errors.fromMonth}</p>}
          </div>
        )}
      </fieldset>

      {submitError && <ErrorBanner message={submitError} />}
      <FormButtons submitting={submitting} submitLabel={t("Save")} onClose={onClose} />
    </form>
  );
}

// ─────────────────────────────────────────────
// Early repayment ("anticipo"). The amount is recorded as an expense named
// "<mortgage> (anticipo)", and the user chooses what it does to the mortgage:
// shorten it keeping the payment, or lower the payment keeping the duration.
// With the borrowed capital known both outcomes are computed and prefilled; the
// figures stay editable so they can match the bank's recalculation exactly.
// Without the capital the user types the new figures from the bank.
// ─────────────────────────────────────────────
type ExtraMode = "keepPayment" | "keepDuration";

export function ExtraPaymentForm({
  plan,
  onSaved,
  onClose,
}: {
  plan: InstallmentPlan;
  onSaved: () => void;
  onClose: () => void;
}) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";

  const base = { payment: plan.amount, total: plan.totalInstallments };
  const terms = currentTerms(base, plan.revisions);
  const generated = plan.generatedCount;

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [mode, setMode] = useState<ExtraMode>("keepPayment");
  // null = the user has not edited the field, so it follows the computed proposal
  const [paymentOverride, setPaymentOverride] = useState<string | null>(null);
  const [remainingOverride, setRemainingOverride] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const parsedAmount = parseFloat(amount);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
  // First installment the new terms apply to (never one that is already recorded).
  const from = validDate
    ? Math.max(installmentsPaidBy(plan.startDate, terms.total, date) + 1, generated + 1)
    : generated + 1;

  const proposal = useMemo(() => {
    if (isNaN(parsedAmount) || parsedAmount <= 0) return null;
    return proposeExtraPayment(
      { payment: plan.amount, count: plan.totalInstallments, capital: plan.financedAmount, revisions: plan.revisions },
      parsedAmount,
      from
    );
  }, [parsedAmount, from, plan]);

  const proposed = proposal ? proposal[mode] : null;
  const proposedRemaining = proposed ? proposed.totalInstallments - (from - 1) : null;

  const paymentValue = paymentOverride ?? (proposed ? String(proposed.payment) : "");
  const remainingValue = remainingOverride ?? (proposedRemaining !== null ? String(proposedRemaining) : "");

  const parsedPayment = parseFloat(paymentValue);
  const parsedRemaining = Number(remainingValue);

  // Resulting end month, for the live summary
  let endLabel = "";
  if (remainingValue !== "" && Number.isInteger(parsedRemaining) && parsedRemaining >= 0) {
    const totalAfter = from - 1 + parsedRemaining;
    if (totalAfter >= 1) endLabel = formatMonthKey(installmentSlot(plan.startDate, totalAfter).monthKey, locale);
  }

  function clear(field: string) {
    setErrors((p) => ({ ...p, [field]: "" }));
  }

  function selectMode(next: ExtraMode) {
    setMode(next);
    // Switching option goes back to that option's computed figures.
    setPaymentOverride(null);
    setRemainingOverride(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (isNaN(parsedAmount) || parsedAmount <= 0) errs.amount = t("Enter a valid amount.");
    if (!validDate) errs.date = t("Date is required.");
    if (isNaN(parsedPayment) || parsedPayment <= 0) errs.payment = t("Enter a valid amount.");
    if (!Number.isInteger(parsedRemaining) || parsedRemaining < 0 || from - 1 + parsedRemaining > MAX_INSTALLMENTS) {
      errs.remaining = t("Enter a valid number of installments left.");
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await addMortgageExtraPayment(plan.id, {
        amount: parsedAmount,
        date,
        payment: parsedPayment,
        totalInstallments: from - 1 + parsedRemaining,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("An error occurred. Please try again."));
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    onSaved();
    onClose();
  }

  const modes: Array<{ id: ExtraMode; label: string }> = [
    { id: "keepPayment", label: t("Shorter duration, same payment") },
    { id: "keepDuration", label: t("Lower payment, same duration") },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="extra-amount" className={labelClass}>
          {t("Amount")} (€) <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="extra-amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); clear("amount"); }}
          placeholder="0.00"
          autoFocus
          aria-invalid={errors.amount ? "true" : undefined}
          className={numberClass}
        />
        {errors.amount && <p role="alert" className="text-[11px] text-negative mt-1">{errors.amount}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="extra-date" className={labelClass}>
          {t("Date")} <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          id="extra-date"
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); clear("date"); }}
          aria-invalid={errors.date ? "true" : undefined}
          className={dateClass}
        />
        {errors.date && <p role="alert" className="text-[11px] text-negative mt-1">{errors.date}</p>}
      </div>

      <div className="space-y-1.5">
        <span id="extra-mode-label" className={labelClass}>{t("What the extra payment does")}</span>
        <div role="radiogroup" aria-labelledby="extra-mode-label" className="flex flex-col sm:flex-row bg-surface-sunken border border-hairline rounded-lg p-1 gap-1">
          {modes.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => selectMode(m.id)}
                className={`flex-1 px-2 py-2 text-xs font-medium leading-tight text-center rounded-md transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active ? "bg-accent text-accent-contrast" : "text-ink-muted hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="extra-payment" className={labelClass}>{t("New monthly payment")} (€)</label>
          <input
            id="extra-payment"
            type="number"
            step="0.01"
            min="0"
            value={paymentValue}
            onChange={(e) => { setPaymentOverride(e.target.value); clear("payment"); }}
            aria-invalid={errors.payment ? "true" : undefined}
            className={numberClass}
          />
          {errors.payment && <p role="alert" className="text-[11px] text-negative mt-1">{errors.payment}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="extra-remaining" className={labelClass}>{t("Installments left")}</label>
          <input
            id="extra-remaining"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            value={remainingValue}
            onChange={(e) => { setRemainingOverride(e.target.value); clear("remaining"); }}
            aria-invalid={errors.remaining ? "true" : undefined}
            className={numberClass}
          />
          {errors.remaining && <p role="alert" className="text-[11px] text-negative mt-1">{errors.remaining}</p>}
        </div>
      </div>

      <div className="text-xs text-ink-muted space-y-1" aria-live="polite">
        {proposal ? (
          <>
            <p className="font-mono tabular-nums">
              {t("Capital after this payment")}: {formatCurrency(proposal.balanceAfter)}
            </p>
            {endLabel && (
              <p className="font-mono tabular-nums">
                {t("Expected end")}: {endLabel}
              </p>
            )}
            <p className="text-ink-faint">{t("Computed from your data; change the figures if your bank's differ.")}</p>
          </>
        ) : (
          <p className="text-ink-faint">
            {plan.financedAmount === null
              ? t("Add the borrowed capital to the mortgage to have these figures computed; otherwise enter the ones from your bank.")
              : t("Enter the figures from your bank.")}
          </p>
        )}
      </div>

      {submitError && <ErrorBanner message={submitError} />}
      <FormButtons submitting={submitting} submitLabel={t("Add prepayment")} onClose={onClose} />
    </form>
  );
}
