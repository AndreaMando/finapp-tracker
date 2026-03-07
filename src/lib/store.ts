"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MonthKey = string; // "YYYY-MM"

export interface MonthlyIncome {
  id: string;
  monthKey: MonthKey;
  amount: number;
  note: string;
  createdAt: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  active: boolean;
  createdAt: string;
}

export interface OneTimeExpense {
  id: string;
  monthKey: MonthKey;
  name: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO date string
  color: string;
  createdAt: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  monthKey: MonthKey;
  amount: number;
  note: string;
  createdAt: string;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  incomes: "fintrack_incomes",
  recurringExpenses: "fintrack_recurring_expenses",
  oneTimeExpenses: "fintrack_one_time_expenses",
  savingsGoals: "fintrack_savings_goals",
  goalContributions: "fintrack_goal_contributions",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function currentMonthKey(): MonthKey {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthKey(key: MonthKey): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ─── Income ───────────────────────────────────────────────────────────────────

export function getIncomes(): MonthlyIncome[] {
  return load<MonthlyIncome>(KEYS.incomes);
}

export function getIncomeForMonth(monthKey: MonthKey): MonthlyIncome | undefined {
  return getIncomes().find((i) => i.monthKey === monthKey);
}

export function upsertIncome(monthKey: MonthKey, amount: number, note: string): MonthlyIncome {
  const all = getIncomes();
  const existing = all.find((i) => i.monthKey === monthKey);
  if (existing) {
    existing.amount = amount;
    existing.note = note;
    save(KEYS.incomes, all);
    return existing;
  }
  const entry: MonthlyIncome = {
    id: uid(),
    monthKey,
    amount,
    note,
    createdAt: new Date().toISOString(),
  };
  save(KEYS.incomes, [...all, entry]);
  return entry;
}

export function deleteIncome(id: string): void {
  save(KEYS.incomes, getIncomes().filter((i) => i.id !== id));
}

// ─── Recurring Expenses ───────────────────────────────────────────────────────

export function getRecurringExpenses(): RecurringExpense[] {
  return load<RecurringExpense>(KEYS.recurringExpenses);
}

export function addRecurringExpense(
  name: string,
  amount: number,
  category: string
): RecurringExpense {
  const entry: RecurringExpense = {
    id: uid(),
    name,
    amount,
    category,
    active: true,
    createdAt: new Date().toISOString(),
  };
  save(KEYS.recurringExpenses, [...getRecurringExpenses(), entry]);
  return entry;
}

export function updateRecurringExpense(
  id: string,
  updates: Partial<Omit<RecurringExpense, "id" | "createdAt">>
): void {
  const all = getRecurringExpenses().map((e) => (e.id === id ? { ...e, ...updates } : e));
  save(KEYS.recurringExpenses, all);
}

export function deleteRecurringExpense(id: string): void {
  save(KEYS.recurringExpenses, getRecurringExpenses().filter((e) => e.id !== id));
}

export function getTotalRecurring(): number {
  return getRecurringExpenses()
    .filter((e) => e.active)
    .reduce((sum, e) => sum + e.amount, 0);
}

// ─── One-Time Expenses ────────────────────────────────────────────────────────

export function getOneTimeExpenses(): OneTimeExpense[] {
  return load<OneTimeExpense>(KEYS.oneTimeExpenses);
}

export function getOneTimeExpensesForMonth(monthKey: MonthKey): OneTimeExpense[] {
  return getOneTimeExpenses().filter((e) => e.monthKey === monthKey);
}

export function addOneTimeExpense(
  monthKey: MonthKey,
  name: string,
  amount: number,
  category: string,
  date: string
): OneTimeExpense {
  const entry: OneTimeExpense = {
    id: uid(),
    monthKey,
    name,
    amount,
    category,
    date,
    createdAt: new Date().toISOString(),
  };
  save(KEYS.oneTimeExpenses, [...getOneTimeExpenses(), entry]);
  return entry;
}

export function deleteOneTimeExpense(id: string): void {
  save(KEYS.oneTimeExpenses, getOneTimeExpenses().filter((e) => e.id !== id));
}

export function getTotalOneTimeForMonth(monthKey: MonthKey): number {
  return getOneTimeExpensesForMonth(monthKey).reduce((sum, e) => sum + e.amount, 0);
}

// ─── Savings Goals ────────────────────────────────────────────────────────────

export const GOAL_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

export function getSavingsGoals(): SavingsGoal[] {
  return load<SavingsGoal>(KEYS.savingsGoals);
}

export function addSavingsGoal(
  name: string,
  targetAmount: number,
  deadline: string,
  color: string
): SavingsGoal {
  const entry: SavingsGoal = {
    id: uid(),
    name,
    targetAmount,
    currentAmount: 0,
    deadline,
    color,
    createdAt: new Date().toISOString(),
  };
  save(KEYS.savingsGoals, [...getSavingsGoals(), entry]);
  return entry;
}

export function updateSavingsGoal(
  id: string,
  updates: Partial<Omit<SavingsGoal, "id" | "createdAt">>
): void {
  const all = getSavingsGoals().map((g) => (g.id === id ? { ...g, ...updates } : g));
  save(KEYS.savingsGoals, all);
}

export function deleteSavingsGoal(id: string): void {
  save(KEYS.savingsGoals, getSavingsGoals().filter((g) => g.id !== id));
  // Also remove contributions
  save(
    KEYS.goalContributions,
    getGoalContributions().filter((c) => c.goalId !== id)
  );
}

// ─── Goal Contributions ───────────────────────────────────────────────────────

export function getGoalContributions(): GoalContribution[] {
  return load<GoalContribution>(KEYS.goalContributions);
}

export function getContributionsForGoal(goalId: string): GoalContribution[] {
  return getGoalContributions().filter((c) => c.goalId === goalId);
}

export function addGoalContribution(
  goalId: string,
  monthKey: MonthKey,
  amount: number,
  note: string
): GoalContribution {
  const entry: GoalContribution = {
    id: uid(),
    goalId,
    monthKey,
    amount,
    note,
    createdAt: new Date().toISOString(),
  };
  save(KEYS.goalContributions, [...getGoalContributions(), entry]);
  // Update goal's currentAmount
  const goals = getSavingsGoals();
  const goal = goals.find((g) => g.id === goalId);
  if (goal) {
    goal.currentAmount = Math.min(goal.currentAmount + amount, goal.targetAmount);
    save(KEYS.savingsGoals, goals);
  }
  return entry;
}

export function deleteGoalContribution(id: string): void {
  const contribution = getGoalContributions().find((c) => c.id === id);
  if (contribution) {
    // Subtract from goal
    const goals = getSavingsGoals();
    const goal = goals.find((g) => g.id === contribution.goalId);
    if (goal) {
      goal.currentAmount = Math.max(0, goal.currentAmount - contribution.amount);
      save(KEYS.savingsGoals, goals);
    }
  }
  save(KEYS.goalContributions, getGoalContributions().filter((c) => c.id !== id));
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

export function getMonthlySummary(monthKey: MonthKey): MonthlySummary {
  const income = getIncomeForMonth(monthKey)?.amount ?? 0;
  const recurringExpenses = getTotalRecurring();
  const oneTimeExpenses = getTotalOneTimeForMonth(monthKey);
  const goalContributions = getGoalContributions()
    .filter((c) => c.monthKey === monthKey)
    .reduce((sum, c) => sum + c.amount, 0);
  const totalExpenses = recurringExpenses + oneTimeExpenses + goalContributions;
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
