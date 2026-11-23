// Pure mortgage maths. Imports only the pure installment helpers.
//
// The user only has to enter the monthly payment and the number of payments.
// If they also give the borrowed capital we can recover the (fixed) monthly
// rate that makes those numbers consistent, and from it the capital / interest
// split of every payment. That split is an ESTIMATE: it assumes the rate is
// constant between two changes. Every revision (a recalculated payment, a
// changed duration, an early repayment) starts a new segment, and the rate of
// that segment is recovered again from the outstanding capital, the new payment
// and the installments left — which is exactly how a variable-rate mortgage
// recalculated "at constant duration" behaves.

import { sortRevisions, type PlanRevision } from "@/lib/installment-math";

export interface MortgageInput {
  /** Initial monthly payment. */
  payment: number;
  /** Initial number of payments. */
  count: number;
  /** Borrowed capital, when the user knows it. */
  capital: number | null;
  /** Later changes, in any order. */
  revisions?: PlanRevision[];
}

export interface TimelineRow {
  /** Installment number, 1-based. */
  n: number;
  payment: number;
  /** Null when the capital (and so the split) is unknown. */
  capitalPart: number | null;
  interestPart: number | null;
  /** Outstanding capital after this installment. */
  balance: number | null;
  /** Monthly rate in force for this installment. */
  rate: number | null;
}

export interface MortgageModel {
  rows: TimelineRow[];
  /**
   * Debt after k payments, k = 0..rows.length: the capital when known,
   * otherwise what is still to be paid. An early repayment shows up as a drop
   * at the point just before the installment it applies from.
   */
  points: number[];
  /** Sum of all early repayments recorded. */
  extrasPaid: number;
}

/**
 * Monthly rate r such that  capital = payment · (1 − (1+r)^−count) / r.
 * Returns 0 when the payments don't even exceed the capital (no interest).
 */
export function impliedMonthlyRate(capital: number, payment: number, count: number): number {
  if (count <= 0 || payment * count <= capital * (1 + 1e-9)) return 0;
  const f = (r: number) => (payment * (1 - Math.pow(1 + r, -count))) / r - capital;
  let lo = 1e-9;
  let hi = 1; // 100% per month: far beyond any real mortgage
  if (f(hi) > 0) return hi;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    // f is decreasing in r: positive means the true rate is higher
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function buildMortgageModel({ payment: basePayment, count: baseCount, capital, revisions = [] }: MortgageInput): MortgageModel {
  const revs = sortRevisions(revisions);
  let payment = basePayment;
  let total = baseCount;
  let balance: number | null = capital !== null && capital > 0 ? capital : null;
  let rate = 0;
  let rateDirty = true;
  let ri = 0;

  const rows: TimelineRow[] = [];
  const payments: number[] = []; // 1-based
  const points: number[] = [];
  if (balance !== null) points[0] = balance;

  let n = 1;
  while (n <= total && n <= 1200) {
    // Apply every change that starts at (or before) this installment.
    while (ri < revs.length && revs[ri].fromInstallment <= n) {
      const rev = revs[ri++];
      if (rev.kind === "extra" && rev.extraAmount && balance !== null) {
        balance = Math.max(0, balance - rev.extraAmount);
        points[n - 1] = balance; // the drop sits just before installment n
      }
      payment = rev.payment;
      total = rev.totalInstallments;
      rateDirty = true;
    }
    if (n > total) break;

    if (balance !== null) {
      if (rateDirty) {
        rate = balance <= 0 ? 0 : impliedMonthlyRate(balance, payment, total - (n - 1));
        rateDirty = false;
      }
      const interestPart = balance * rate;
      const capitalPart = n === total ? balance : Math.min(balance, Math.max(0, payment - interestPart));
      balance = Math.max(0, balance - capitalPart);
      rows.push({ n, payment, capitalPart, interestPart, balance, rate });
      points[n] = balance;
    } else {
      rows.push({ n, payment, capitalPart: null, interestPart: null, balance: null, rate: null });
    }
    payments[n] = payment;
    n++;
  }

  if (capital === null || capital <= 0) {
    // No capital: the "debt" is what is left to pay, installment by installment.
    let remaining = 0;
    for (let k = rows.length; k >= 0; k--) {
      points[k] = remaining;
      if (k > 0) remaining += payments[k];
    }
  }

  const extrasPaid = revs.reduce((sum, r) => sum + (r.kind === "extra" ? r.extraAmount ?? 0 : 0), 0);
  return { rows, points, extrasPaid };
}

export interface MortgageSummary {
  /** Number of installments in the plan as it stands now. */
  count: number;
  totalToPay: number;
  paidAmount: number;
  remainingToPay: number;
  /** 0–1 share repaid: capital-based when known, otherwise by amount paid. */
  progress: number;
  /** Only when the capital is known: */
  monthlyRate: number | null;
  /** Nominal yearly rate (monthly × 12), estimated. */
  annualRate: number | null;
  capitalRepaid: number | null;
  capitalRemaining: number | null;
  interestTotal: number | null;
  interestPaid: number | null;
}

export function summarizeMortgage(input: MortgageInput & { paid: number }): MortgageSummary {
  const { rows, points, extrasPaid } = buildMortgageModel(input);
  const count = rows.length;
  const k = Math.max(0, Math.min(count, input.paid));

  const paidPayments = rows.slice(0, k).reduce((s, r) => s + r.payment, 0);
  const remainingToPay = rows.slice(k).reduce((s, r) => s + r.payment, 0);
  const paidAmount = paidPayments + extrasPaid;
  const totalToPay = paidAmount + remainingToPay;
  const base = { count, totalToPay, paidAmount, remainingToPay };

  const capital = input.capital;
  if (capital === null || capital <= 0) {
    return {
      ...base,
      progress: totalToPay > 0 ? paidAmount / totalToPay : 0,
      monthlyRate: null,
      annualRate: null,
      capitalRepaid: null,
      capitalRemaining: null,
      interestTotal: null,
      interestPaid: null,
    };
  }

  const capitalRemaining = points[k] ?? 0;
  const capitalRepaid = capital - capitalRemaining;
  const rate = rows[k]?.rate ?? rows[k - 1]?.rate ?? 0;
  return {
    ...base,
    progress: capital > 0 ? capitalRepaid / capital : 0,
    monthlyRate: rate,
    annualRate: rate * 12,
    capitalRepaid,
    capitalRemaining,
    interestTotal: rows.reduce((s, r) => s + (r.interestPart ?? 0), 0),
    interestPaid: rows.slice(0, k).reduce((s, r) => s + (r.interestPart ?? 0), 0),
  };
}

export interface DebtPoint {
  /** Payments made so far (0 = just after signing). */
  k: number;
  debt: number;
}

/** The line the charts draw. */
export function debtCurve(input: MortgageInput): DebtPoint[] {
  return buildMortgageModel(input).points.map((debt, k) => ({ k, debt }));
}

export interface ExtraPaymentProposal {
  /** Capital still owed right after the extra payment. */
  balanceAfter: number;
  /** The loan is fully repaid by this payment. */
  paidOff: boolean;
  /** Keep the payment, shorten the loan. */
  keepPayment: { payment: number; totalInstallments: number };
  /** Keep the duration, lower the payment. */
  keepDuration: { payment: number; totalInstallments: number };
}

/**
 * What an early repayment of `extraAmount`, effective from installment `from`,
 * does to the plan under each of the two options a bank offers. Needs the
 * borrowed capital (the rate is derived from it); returns null without it —
 * the user then types the figures from the bank instead.
 */
export function proposeExtraPayment(input: MortgageInput, extraAmount: number, from: number): ExtraPaymentProposal | null {
  if (input.capital === null || input.capital <= 0) return null;
  const { rows } = buildMortgageModel(input);
  const next = rows[from - 1];
  if (!next) return null;

  const before = from >= 2 ? rows[from - 2].balance : input.capital;
  if (before === null) return null;
  const r = next.rate ?? 0;
  const p = next.payment;
  const remaining = rows.length - (from - 1);
  const balanceAfter = Math.max(0, before - extraAmount);

  if (balanceAfter <= 0) {
    const same = { payment: p, totalInstallments: from - 1 };
    return { balanceAfter: 0, paidOff: true, keepPayment: same, keepDuration: same };
  }

  // Keep the payment: how many installments does the smaller debt need?
  let newRemaining: number;
  if (r > 0) {
    const x = 1 - (balanceAfter * r) / p;
    if (x <= 0) return null; // the payment would not even cover the interest
    newRemaining = Math.ceil(-Math.log(x) / Math.log(1 + r) - 1e-9);
  } else {
    newRemaining = Math.ceil(balanceAfter / p - 1e-9);
  }
  newRemaining = Math.max(1, Math.min(remaining, newRemaining));

  // Keep the duration: what payment clears the smaller debt in the same time?
  const newPayment = r > 0 ? (balanceAfter * r) / (1 - Math.pow(1 + r, -remaining)) : balanceAfter / remaining;

  return {
    balanceAfter,
    paidOff: false,
    keepPayment: { payment: p, totalInstallments: from - 1 + newRemaining },
    keepDuration: { payment: Math.round(newPayment * 100) / 100, totalInstallments: from - 1 + remaining },
  };
}
