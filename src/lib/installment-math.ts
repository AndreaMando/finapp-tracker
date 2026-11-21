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
