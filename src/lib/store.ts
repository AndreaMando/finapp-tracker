"use client";

import type { PlanRevision } from "@/lib/installment-math";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MonthKey = string; // "YYYY-MM"

export interface MonthlyIncome {
  id: string;
  monthKey: MonthKey;
  amount: number;
  note: string;
  createdAt: Date;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  active: boolean;
  startMonth: MonthKey;
  endMonth?: MonthKey | null;
  createdAt: Date;
}

export interface OneTimeExpense {
  id: string;
  monthKey: MonthKey;
  name: string;
  amount: number;
  category: string;
  date: Date;
  /** Set when the expense was recorded by an installment plan / mortgage. */
  sourceInstallmentId?: string | null;
  /** Installment number, or null/undefined for an extra (early) repayment of a mortgage. */
  installmentNumber?: number | null;
  createdAt: Date;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  color: string;
  createdAt: Date;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  monthKey: MonthKey;
  amount: number;
  note: string;
  createdAt: Date;
}

// -----------------------------------------------------------------------------
// network helpers
// -----------------------------------------------------------------------------

const API_BASE = "/api";

export function currentMonthKey(): MonthKey {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthKey(key: MonthKey, locale: string = "en-US"): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  let formatted = date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  if (locale.startsWith("it") && formatted.length > 0) {
    formatted = formatted[0].toUpperCase() + formatted.slice(1);
  }
  return formatted;
}

export function formatDate(iso: string | Date, locale: string = "en-US"): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  let formatted = d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  if (locale.startsWith("it") && formatted.length > 0) {
    formatted = formatted[0].toUpperCase() + formatted.slice(1);
  }
  return formatted;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== "undefined") {
        // Redirect unauthenticated users to the login page
        window.location.href = "/";
      }
      throw new Error("API Error: Unauthorized");
    }
    throw new Error(`API Error: ${res.statusText}`);
  }
  return res.json();
}

// mutate() wraps fetch for POST/PUT/DELETE calls that don't necessarily
// return a body we care about, but whose success we DO need to verify —
// a silent failure here would leave the UI showing a change that never
// actually happened server-side.
async function mutate(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== "undefined") window.location.href = "/";
      throw new Error("API Error: Unauthorized");
    }
    let message = `API Error: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON — keep the statusText-based message
    }
    throw new Error(message);
  }
  return res;
}

// ─── Income ───────────────────────────────────────────────────────────────────

export async function getIncomes(): Promise<MonthlyIncome[]> {
  const data = await fetchJson<any[]>(`${API_BASE}/incomes`);
  return data.map(d => ({
    ...d,
    amount: Number(d.amount),
    createdAt: new Date(d.createdAt)
  }));
}

export async function getIncomeForMonth(monthKey: MonthKey): Promise<MonthlyIncome | undefined> {
  const data = await fetchJson<any[]>(`${API_BASE}/incomes?monthKey=${encodeURIComponent(monthKey)}`);
  const income = data[0];
  return income ? { ...income, amount: Number(income.amount), createdAt: new Date(income.createdAt) } : undefined;
}

export async function upsertIncome(monthKey: MonthKey, amount: number, note: string): Promise<MonthlyIncome> {
  const res = await mutate(`${API_BASE}/incomes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monthKey, amount, note }),
  });
  const d = await res.json();
  return { ...d, amount: Number(d.amount), createdAt: new Date(d.createdAt) };
}

export async function deleteIncome(id: string): Promise<void> {
  await mutate(`${API_BASE}/incomes/${id}`, { method: "DELETE" });
}

// ─── Recurring Expenses ───────────────────────────────────────────────────────

export async function getRecurringExpenses(monthKey?: MonthKey): Promise<RecurringExpense[]> {
  const qs = monthKey ? `?monthKey=${encodeURIComponent(monthKey)}` : "";
  const data = await fetchJson<any[]>(`${API_BASE}/recurring${qs}`);
  return data.map(d => ({
    ...d,
    amount: Number(d.amount),
    active: Boolean(d.active),
    createdAt: new Date(d.createdAt)
  }));
}

export async function addRecurringExpense(
  name: string,
  amount: number,
  category: string,
  startMonth: MonthKey,
  endMonth?: MonthKey | null
): Promise<RecurringExpense> {
  const res = await mutate(`${API_BASE}/recurring`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, amount, category, startMonth, endMonth }),
  });
  const d = await res.json();
  return { ...d, amount: Number(d.amount), active: Boolean(d.active), createdAt: new Date(d.createdAt) };
}

export async function updateRecurringExpense(
  id: string,
  updates: Partial<Omit<RecurringExpense, "id" | "createdAt">> & { applyFromMonth?: MonthKey }
): Promise<void> {
  await mutate(`${API_BASE}/recurring/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function previewRecurringForMonth(monthKey: MonthKey) {
  const data = await fetchJson<any[]>(`${API_BASE}/recurring/preview?monthKey=${encodeURIComponent(monthKey)}`);
  return data.map(d => ({ ...d, amount: Number(d.amount) }));
}

export async function applyRecurringSelections(monthKey: MonthKey, items: Array<{ id: string; amount?: number }>) {
  const res = await mutate(`${API_BASE}/recurring/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monthKey, items }),
  });
  return res.json();
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  await mutate(`${API_BASE}/recurring/${id}`, { method: "DELETE" });
}

export async function getTotalRecurring(monthKey: MonthKey = currentMonthKey()): Promise<number> {
  const ex = await getRecurringExpenses(monthKey);
  return ex
    .filter((e) => e.active && e.startMonth <= monthKey && (!e.endMonth || e.endMonth >= monthKey))
    .reduce((sum, e) => sum + e.amount, 0);
}

// ─── One-Time Expenses ────────────────────────────────────────────────────────

export async function getOneTimeExpenses(): Promise<OneTimeExpense[]> {
  const data = await fetchJson<any[]>(`${API_BASE}/one-time`);
  return data.map(d => ({
    ...d,
    amount: Number(d.amount),
    date: new Date(d.date),
    createdAt: new Date(d.createdAt)
  }));
}

export async function getOneTimeExpensesForMonth(monthKey: MonthKey): Promise<OneTimeExpense[]> {
  const data = await fetchJson<any[]>(`${API_BASE}/one-time?monthKey=${encodeURIComponent(monthKey)}`);
  return data.map(d => ({
    ...d,
    amount: Number(d.amount),
    date: new Date(d.date),
    createdAt: new Date(d.createdAt)
  }));
}

export async function addOneTimeExpense(
  monthKey: MonthKey,
  name: string,
  amount: number,
  category: string,
  date: Date
): Promise<OneTimeExpense> {
  const res = await mutate(`${API_BASE}/one-time`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monthKey, name, amount, category, date }),
  });
  const d = await res.json();
  return {
    ...d,
    amount: Number(d.amount),
    date: new Date(d.date),
    createdAt: new Date(d.createdAt)
  };
}

export async function updateOneTimeExpense(
  id: string,
  updates: Partial<Omit<OneTimeExpense, "id" | "createdAt">>
): Promise<void> {
  await mutate(`${API_BASE}/one-time/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function deleteOneTimeExpense(id: string): Promise<void> {
  await mutate(`${API_BASE}/one-time/${id}`, { method: "DELETE" });
}

export async function getTotalOneTimeForMonth(monthKey: MonthKey): Promise<number> {
  const items = await getOneTimeExpensesForMonth(monthKey);
  return items.reduce((sum, e) => sum + e.amount, 0);
}

// ─── Installment payments ─────────────────────────────────────────────────────
// A plan of N fixed monthly installments. The installments themselves are
// recorded server-side as regular one-time expenses when their month begins
// (see getOneTimeExpenses*), so this only manages the plans.

export interface InstallmentPlan {
  id: string;
  name: string;
  /** Amount of a single installment. */
  amount: number;
  category: string;
  /** "YYYY-MM-DD" — due date of installment nr. 1; later ones keep its day of month. */
  startDate: string;
  totalInstallments: number;
  /** How many installments have been recorded as expenses so far. */
  generatedCount: number;
  /** "installment" for a regular plan, "mortgage" for a mortgage (same monthly mechanism). */
  kind: "installment" | "mortgage";
  /** Borrowed capital — only for mortgages, and optional. */
  financedAmount: number | null;
  /** Later changes: recalculated payments and early repayments (mortgages). */
  revisions: PlanRevision[];
  createdAt: Date;
}

function toInstallmentPlan(d: any): InstallmentPlan {
  return {
    ...d,
    revisions: Array.isArray(d.revisions) ? d.revisions : [],
    amount: Number(d.amount),
    kind: d.kind === "mortgage" ? "mortgage" : "installment",
    financedAmount: d.financedAmount === null || d.financedAmount === undefined ? null : Number(d.financedAmount),
    createdAt: new Date(d.createdAt),
  };
}

export async function getInstallmentPlans(): Promise<InstallmentPlan[]> {
  const data = await fetchJson<any[]>(`${API_BASE}/installments`);
  return data.map(toInstallmentPlan);
}

export async function addInstallmentPlan(
  name: string,
  amount: number,
  category: string,
  startDate: string,
  totalInstallments: number,
  options?: { kind?: "installment" | "mortgage"; financedAmount?: number | null }
): Promise<InstallmentPlan> {
  const res = await mutate(`${API_BASE}/installments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name, amount, category, startDate, totalInstallments,
      kind: options?.kind,
      financedAmount: options?.financedAmount,
    }),
  });
  return toInstallmentPlan(await res.json());
}

export async function deleteInstallmentPlan(id: string): Promise<void> {
  await mutate(`${API_BASE}/installments/${id}`, { method: "DELETE" });
}

/** Edit a plan: rename, set/clear the borrowed capital, or revise payment / duration from an installment on. */
export async function updateInstallmentPlan(
  id: string,
  changes: {
    name?: string;
    financedAmount?: number | null;
    startDate?: string;
    revision?: { payment: number; totalInstallments: number; fromInstallment: number };
  }
): Promise<InstallmentPlan> {
  const res = await mutate(`${API_BASE}/installments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  return toInstallmentPlan(await res.json());
}

/** Record an early repayment ("anticipo") and the plan's terms afterwards. */
export async function addMortgageExtraPayment(
  id: string,
  extra: { amount: number; date: string; payment: number; totalInstallments: number }
): Promise<InstallmentPlan> {
  const res = await mutate(`${API_BASE}/installments/${id}/extra`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(extra),
  });
  return toInstallmentPlan(await res.json());
}

export async function deletePlanRevision(planId: string, revisionId: string): Promise<void> {
  await mutate(`${API_BASE}/installments/${planId}/revisions/${revisionId}`, { method: "DELETE" });
}

// ─── Savings Goals & Contributions (network-backed) ───────────────────────────

export const GOAL_COLORS = [
  "#6366f1",
  "#02dd1f",
  "#f59e0b",
  "#ef4444",
  "#0e63eb",
  "#5899d6",
  "#c9739e",
  "#28a395",
];

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const data = await fetchJson<any[]>(`${API_BASE}/goals`);
  return data.map(d => ({
    ...d,
    targetAmount: Number(d.targetAmount),
    currentAmount: Number(d.currentAmount),
    deadline: new Date(d.deadline),
    createdAt: new Date(d.createdAt)
  }));
}

export async function addSavingsGoal(
  name: string,
  targetAmount: number,
  deadline: Date,
  color: string
): Promise<SavingsGoal> {
  const res = await mutate(`${API_BASE}/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, targetAmount, deadline, color }),
  });
  const d = await res.json();
  return {
    ...d,
    targetAmount: Number(d.targetAmount),
    currentAmount: Number(d.currentAmount),
    deadline: new Date(d.deadline),
    createdAt: new Date(d.createdAt)
  };
}

export async function updateSavingsGoal(
  id: string,
  updates: Partial<Omit<SavingsGoal, "id" | "createdAt">>
): Promise<void> {
  await mutate(`${API_BASE}/goals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  await mutate(`${API_BASE}/goals/${id}`, { method: "DELETE" });
}

export async function getGoalContributions(): Promise<GoalContribution[]> {
  const data = await fetchJson<any[]>(`${API_BASE}/contributions`);
  return data.map(d => ({
    ...d,
    amount: Number(d.amount),
    createdAt: new Date(d.createdAt)
  }));
}

export async function getContributionsForGoal(goalId: string): Promise<GoalContribution[]> {
  const data = await fetchJson<any[]>(`${API_BASE}/contributions?goalId=${encodeURIComponent(goalId)}`);
  return data.map(d => ({
    ...d,
    amount: Number(d.amount),
    createdAt: new Date(d.createdAt)
  }));
}

export async function addGoalContribution(
  goalId: string,
  monthKey: MonthKey,
  amount: number,
  note: string
): Promise<GoalContribution> {
  const res = await mutate(`${API_BASE}/contributions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goalId, monthKey, amount, note }),
  });
  const d = await res.json();
  return {
    ...d,
    amount: Number(d.amount),
    createdAt: new Date(d.createdAt)
  };
}

export async function deleteGoalContribution(id: string): Promise<void> {
  await mutate(`${API_BASE}/contributions/${id}`, { method: "DELETE" });
}

// ─── Monthly Summary ──────────────────────────────────────────────────────────

export interface MonthlySummary {
  monthKey: MonthKey;
  income: number;
  recurringExpenses: number;
  oneTimeExpenses: number;
  goalContributions: number;
  totalExpenses: number;
  savings: number;
}

export async function getMonthlySummary(monthKey: MonthKey): Promise<MonthlySummary> {
  const [incomeEntry, recurringExpenses, oneTimeExpenses, goalContributionsData] = await Promise.all([
    getIncomeForMonth(monthKey),
    getTotalRecurring(monthKey),
    getTotalOneTimeForMonth(monthKey),
    fetchJson<any[]>(`${API_BASE}/contributions?monthKey=${encodeURIComponent(monthKey)}`),
  ]);
  const income = incomeEntry?.amount ?? 0;
  const goalContributions = goalContributionsData.reduce((sum, c) => sum + Number(c.amount), 0);

  // Recurring expenses only count once the user confirms them via "Apply
  // Recurring Expenses" — at that point they're inserted into one-time
  // expenses, so oneTimeExpenses already reflects any applied recurring
  // costs. Goal contributions are intentionally NOT deducted from savings:
  // that money hasn't left the user's pocket, it's just earmarked.
  const totalExpenses = recurringExpenses + oneTimeExpenses;
  const savings = income - oneTimeExpenses;

  return {
    monthKey,
    income,
    recurringExpenses,
    oneTimeExpenses,
    goalContributions,
    totalExpenses,
    savings,
  };
}
