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
  startMonth: MonthKey;
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
    throw new Error(`API Error: ${res.statusText}`);
  }
  return res.json();
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
  const incomes = await getIncomes();
  return incomes.find((i) => i.monthKey === monthKey);
}

export async function upsertIncome(monthKey: MonthKey, amount: number, note: string): Promise<MonthlyIncome> {
  const res = await fetch(`${API_BASE}/incomes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monthKey, amount, note }),
  });
  const d = await res.json();
  return { ...d, amount: Number(d.amount), createdAt: new Date(d.createdAt) };
}

export async function deleteIncome(id: string): Promise<void> {
  await fetch(`${API_BASE}/incomes/${id}`, { method: "DELETE" });
}

// ─── Recurring Expenses ───────────────────────────────────────────────────────

export async function getRecurringExpenses(): Promise<RecurringExpense[]> {
  const data = await fetchJson<any[]>(`${API_BASE}/recurring`);
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
  startMonth: MonthKey
): Promise<RecurringExpense> {
  const res = await fetch(`${API_BASE}/recurring`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, amount, category, startMonth }),
  });
  const d = await res.json();
  return { ...d, amount: Number(d.amount), active: Boolean(d.active), createdAt: new Date(d.createdAt) };
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
  const data = await fetchJson<any[]>(`${API_BASE}/one-time`);
  return data.map(d => ({
    ...d,
    amount: Number(d.amount),
    date: new Date(d.date),
    createdAt: new Date(d.createdAt)
  }));
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
  const res = await fetch(`${API_BASE}/one-time`, {
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
  const res = await fetch(`${API_BASE}/goals`, {
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
  const data = await fetchJson<any[]>(`${API_BASE}/contributions`);
  return data.map(d => ({
    ...d,
    amount: Number(d.amount),
    createdAt: new Date(d.createdAt)
  }));
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
  const res = await fetch(`${API_BASE}/contributions`, {
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
  const recurringExpenses = await getTotalRecurring(monthKey);
  const oneTimeExpenses = await getTotalOneTimeForMonth(monthKey);
  const goalContributions = (await getGoalContributions())
    .filter((c) => c.monthKey === monthKey)
    .reduce((sum, c) => sum + c.amount, 0);
  
  const totalExpenses = recurringExpenses + oneTimeExpenses;
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
