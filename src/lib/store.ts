"use client";

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
  startMonth: MonthKey; // month when expense begins (inclusive)
  createdAt: Date;
}

export interface OneTimeExpense {
  id: string;
  monthKey: MonthKey;
  name: string;
  amount: number;
  category: string;
  date: Date;
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

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function currentMonthKey(): MonthKey {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthKey(key: MonthKey, locale: string = "en-US"): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  let formatted = date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  // Italian month names come back lowercase; capitalize the first letter to match UI style
  if (locale.startsWith("it") && formatted.length > 0) {
    formatted = formatted[0].toUpperCase() + formatted.slice(1);
  }
  return formatted;
}

// format a full ISO date string (e.g. for one-time expenses or deadlines)
export function formatDate(iso: string, locale: string = "en-US"): string {
  const d = new Date(iso);
  let formatted = d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  if (locale.startsWith("it") && formatted.length > 0) {
    formatted = formatted[0].toUpperCase() + formatted.slice(1);
  }
  return formatted;
}

// ─── Income ───────────────────────────────────────────────────────────────────

export async function getIncomes(): Promise<MonthlyIncome[]> {
  const res = await fetch(`${API_BASE}/incomes`);
  return res.json();
}

export async function getIncomeForMonth(monthKey: MonthKey): Promise<MonthlyIncome | undefined> {
  const incomes = await getIncomes();
  return incomes.find((i) => i.monthKey === monthKey);
}

export async function upsertIncome(monthKey: MonthKey, amount: number, note: string): Promise<MonthlyIncome> {
  const entry: MonthlyIncome = {
    id: uid(),
    monthKey,
    amount,
    note,
    createdAt: new Date(),
  };
  const res = await fetch(`${API_BASE}/incomes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  return res.json();
}

export async function deleteIncome(id: string): Promise<void> {
  await fetch(`${API_BASE}/incomes/${id}`, { method: "DELETE" });
}

// ─── Recurring Expenses ───────────────────────────────────────────────────────

export async function getRecurringExpenses(): Promise<RecurringExpense[]> {
  const res = await fetch(`${API_BASE}/recurring`);
  const data: RecurringExpense[] = await res.json();
  // the backend stores `active` as 0/1; convert to boolean for client
  return data.map((e) => ({ ...e, active: !!e.active }));
}

export async function addRecurringExpense(
  name: string,
  amount: number,
  category: string,
  startMonth: MonthKey
): Promise<RecurringExpense> {
  const entry: RecurringExpense = {
    id: uid(),
    name,
    amount,
    category,
    active: true,
    startMonth,
    createdAt: new Date(),
  };
  const res = await fetch(`${API_BASE}/recurring`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  return res.json();
}

export async function updateRecurringExpense(
  id: string,
  updates: Partial<Omit<RecurringExpense, "id" | "createdAt">>
): Promise<void> {
  await fetch(`${API_BASE}/recurring/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  await fetch(`${API_BASE}/recurring/${id}`, { method: "DELETE" });
}

export async function getTotalRecurring(monthKey: MonthKey = currentMonthKey()): Promise<number> {
  const ex = await getRecurringExpenses();
  return ex
    .filter((e) => e.active && e.startMonth <= monthKey)
    .reduce((sum, e) => sum + e.amount, 0);
}

// ─── One-Time Expenses ────────────────────────────────────────────────────────

export async function getOneTimeExpenses(): Promise<OneTimeExpense[]> {
  const res = await fetch(`${API_BASE}/one-time`);
  return res.json();
}

export async function getOneTimeExpensesForMonth(monthKey: MonthKey): Promise<OneTimeExpense[]> {
  const all = await getOneTimeExpenses();
  return all.filter((e) => e.monthKey === monthKey);
}

export async function addOneTimeExpense(
  monthKey: MonthKey,
  name: string,
  amount: number,
  category: string,
  date: Date
): Promise<OneTimeExpense> {
  const entry: OneTimeExpense = {
    id: uid(),
    monthKey,
    name,
    amount,
    category,
    date,
    createdAt: new Date(),
  };
  const res = await fetch(`${API_BASE}/one-time`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  return res.json();
}

export async function updateOneTimeExpense(
  id: string,
  updates: Partial<Omit<OneTimeExpense, "id" | "createdAt">>
): Promise<void> {
  await fetch(`${API_BASE}/one-time/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function deleteOneTimeExpense(id: string): Promise<void> {
  await fetch(`${API_BASE}/one-time/${id}`, { method: "DELETE" });
}

export async function getTotalOneTimeForMonth(monthKey: MonthKey): Promise<number> {
  const items = await getOneTimeExpensesForMonth(monthKey);
  return items.reduce((sum, e) => sum + e.amount, 0);
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
  const res = await fetch(`${API_BASE}/goals`);
  return res.json();
}

export async function addSavingsGoal(
  name: string,
  targetAmount: number,
  deadline: Date,
  color: string
): Promise<SavingsGoal> {
  const entry: SavingsGoal = {
    id: uid(),
    name,
    targetAmount,
    currentAmount: 0,
    deadline,
    color,
    createdAt: new Date(),
  };
  const res = await fetch(`${API_BASE}/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  return res.json();
}

export async function updateSavingsGoal(
  id: string,
  updates: Partial<Omit<SavingsGoal, "id" | "createdAt">>
): Promise<void> {
  await fetch(`${API_BASE}/goals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  await fetch(`${API_BASE}/goals/${id}`, { method: "DELETE" });
}

export async function getGoalContributions(): Promise<GoalContribution[]> {
  const res = await fetch(`${API_BASE}/contributions`);
  return res.json();
}

export async function getContributionsForGoal(goalId: string): Promise<GoalContribution[]> {
  const all = await getGoalContributions();
  return all.filter((c) => c.goalId === goalId);
}

export async function addGoalContribution(
  goalId: string,
  monthKey: MonthKey,
  amount: number,
  note: string
): Promise<GoalContribution> {
  const entry: GoalContribution = {
    id: uid(),
    goalId,
    monthKey,
    amount,
    note,
    createdAt: new Date(),
  };
  const res = await fetch(`${API_BASE}/contributions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  return res.json();
}

export async function deleteGoalContribution(id: string): Promise<void> {
  await fetch(`${API_BASE}/contributions/${id}`, { method: "DELETE" });
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
  const income = (await getIncomeForMonth(monthKey))?.amount ?? 0;
  const recurringExpenses = await getTotalRecurring();
  const oneTimeExpenses = await getTotalOneTimeForMonth(monthKey);
  const goalContributions = (await getGoalContributions())
    .filter((c) => c.monthKey === monthKey)
    .reduce((sum, c) => sum + c.amount, 0);
  // do not include goal contributions in the "total expenses" figure
  const totalExpenses = recurringExpenses + oneTimeExpenses;
  // savings are calculated against actual spending, not contributions
  const savings = income - totalExpenses;
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
