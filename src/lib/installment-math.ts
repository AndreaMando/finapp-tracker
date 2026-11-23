// Pure date math for installment plans, shared by the server (which records
// installments) and the client (which previews them). No imports, no I/O.

export const MIN_INSTALLMENTS = 2;
export const MAX_INSTALLMENTS = 360;

export interface InstallmentSlot {
  /** "YYYY-MM-DD" — the day the installment falls due. */
  isoDate: string;
  /** "YYYY-MM" */
  monthKey: string;
}

export function parseIsoDate(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) return null;
  return { y, m, d };
}

/**
 * Date of the n-th installment (1-based). Every installment keeps the original
 * day of the month; when a month is too short for it (e.g. the 30th in
 * February) it falls on that month's last day, and the next month goes back to
 * the original day — the "end of month" convention banks use, never a drifting
 * 28th for the rest of the plan.
 */
export function installmentSlot(startIso: string, n: number): InstallmentSlot {
  const p = parseIsoDate(startIso);
  if (!p) throw new Error(`Invalid start date: ${startIso}`);
  const monthIndex = p.m - 1 + (n - 1);
  const year = p.y + Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(p.d, daysInMonth);
  const mm = String(month + 1).padStart(2, "0");
  return {
    isoDate: `${year}-${mm}-${String(day).padStart(2, "0")}`,
    monthKey: `${year}-${mm}`,
  };
}

/**
 * How many installments are due by `nowMonthKey`: an installment is due as soon
 * as its month begins (the 1st), not on its own day, so the whole month's
 * figures are complete from the start of the month but future months stay empty.
 */
export function dueInstallmentCount(startIso: string, total: number, nowMonthKey: string): number {
  const p = parseIsoDate(startIso);
  if (!p) return 0;
  const [ny, nm] = nowMonthKey.split("-").map(Number);
  const elapsed = (ny * 12 + (nm - 1)) - (p.y * 12 + (p.m - 1)) + 1;
  return Math.max(0, Math.min(total, elapsed));
}

// ─── Revisions ────────────────────────────────────────────────────────────────
// A plan starts with a base payment / installment count and can later be
// revised (payment recalculated, duration changed, early repayment). Each
// revision holds the terms that apply FROM a given installment number on.

export interface PlanRevision {
  id: string;
  kind: "revision" | "extra";
  /** First installment (1-based) the new terms apply to. */
  fromInstallment: number;
  payment: number;
  /** Total number of installments of the plan from this revision on. */
  totalInstallments: number;
  extraAmount: number | null;
  extraDate: string | null;
  createdAt: string;
}

export interface PlanTerms {
  payment: number;
  total: number;
}

type RevisionLike = Pick<PlanRevision, "fromInstallment" | "payment" | "totalInstallments"> & { createdAt?: string | Date };

export function sortRevisions<T extends RevisionLike>(revisions: T[]): T[] {
  const time = (r: RevisionLike) => (r.createdAt ? new Date(r.createdAt).getTime() : 0);
  return [...revisions].sort((a, b) => a.fromInstallment - b.fromInstallment || time(a) - time(b));
}

/** Terms in force for installment `n`. */
export function termsAt(base: PlanTerms, revisions: RevisionLike[], n: number): PlanTerms {
  let terms = base;
  for (const r of sortRevisions(revisions)) {
    if (r.fromInstallment <= n) terms = { payment: r.payment, total: r.totalInstallments };
  }
  return terms;
}

/** Terms after every revision — what the plan looks like now. */
export function currentTerms(base: PlanTerms, revisions: RevisionLike[]): PlanTerms {
  const sorted = sortRevisions(revisions);
  const last = sorted[sorted.length - 1];
  return last ? { payment: last.payment, total: last.totalInstallments } : base;
}

/** How many installments fall due on or before `dateIso` (their own day, not the month start). */
export function installmentsPaidBy(startIso: string, total: number, dateIso: string): number {
  let count = 0;
  for (let n = 1; n <= total; n++) {
    if (installmentSlot(startIso, n).isoDate <= dateIso) count = n;
    else break;
  }
  return count;
}

/** Installment number (1-based) whose month is `monthKey` — may be < 1 or > total. */
export function installmentIndexForMonth(startIso: string, monthKey: string): number {
  const p = parseIsoDate(startIso);
  if (!p) return 1;
  const [y, m] = monthKey.split("-").map(Number);
  return (y * 12 + (m - 1)) - (p.y * 12 + (p.m - 1)) + 1;
}
