"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import {
  currentMonthKey,
  formatMonthKey,
  getMonthlySummary,
  getSavingsGoals,
  type MonthlySummary,
  type SavingsGoal,
} from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function addMonths(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

function StatCard({ label, value, icon, color, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color.replace("text-", "bg-").replace("-600", "-50").replace("-500", "-50")}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function GoalCard({ goal }: { goal: SavingsGoal }) {
  const { t } = useTranslation();
  const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  const remaining = goal.targetAmount - goal.currentAmount;
  const deadline = new Date(goal.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: goal.color }} />
          <span className="font-semibold text-gray-800 text-sm">{goal.name}</span>
        </div>
        <span className="text-xs text-gray-400">
          {daysLeft > 0 ? `${daysLeft}${t("d left")}` : t("Overdue")}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: goal.color }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatCurrency(goal.currentAmount)} {t("saved")}</span>
        <span>{formatCurrency(remaining)} {t("to go")}</span>
      </div>
      <p className="text-right text-xs font-semibold mt-1" style={{ color: goal.color }}>
        {pct.toFixed(0)}%
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { t, lang, setLang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  useEffect(() => {
    async function load() {
      const s = await getMonthlySummary(monthKey);
      const g = await getSavingsGoals();
      setSummary(s);
      setGoals(g);
    }
    load();
  }, [monthKey]);

  if (!summary) return null;

  const savingsColor =
    summary.savings >= 0 ? "text-emerald-600" : "text-red-500";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("Dashboard")}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t("Your monthly financial overview")}</p>
        </div>
        {/*<div className="flex items-center gap-4">
          <label className="text-sm text-gray-600">{t("Language")}:</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as "en" | "it")}
            className="border border-gray-200 rounded-xl px-2 py-1 text-sm cursor-pointer"
          >
            <option value="en">English</option>
            <option value="it">Italiano</option>
          </select>
        </div>*/}
        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
          <button
            onClick={() => setMonthKey(addMonths(monthKey, -1))}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[130px] text-center">
            {formatMonthKey(monthKey, locale)}
          </span>
          <button
            onClick={() => setMonthKey(addMonths(monthKey, 1))}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={t("Income")}
          value={formatCurrency(summary.income)}
          icon={<TrendingUp size={20} className="text-emerald-600" />}
          color="text-emerald-600"
        />
        <StatCard
          label={t("Total Expenses")}
          value={formatCurrency(summary.totalExpenses)}
          icon={<TrendingDown size={20} className="text-red-500" />}
          color="text-red-500"
          sub={`${t("Recurring")} : ${formatCurrency(summary.recurringExpenses)}`}
        />
        <StatCard
          label={t("Goal Contributions")}
          value={formatCurrency(summary.goalContributions)}
          icon={<Target size={20} className="text-indigo-600" />}
          color="text-indigo-600"
        />
        <StatCard
          label={t("Net Savings")}
          value={formatCurrency(summary.savings)}
          icon={<PiggyBank size={20} className={savingsColor} />}
          color={savingsColor}
        />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Expense Breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">{t("Expense Breakdown")}</h2>
          {summary.income === 0 && summary.totalExpenses === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              {t("No data for this month yet.")}{" "}
              <Link href="/income" className="text-indigo-500 hover:underline">
                {t("Add income")}
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {[
                {
                  label: t("Recurring Expenses"),
                  amount: summary.recurringExpenses,
                  color: "bg-orange-400",
                },
                {
                  label: t("One-time Expenses"),
                  amount: summary.oneTimeExpenses,
                  color: "bg-red-400",
                },
                {
                  label: t("Goal Contributions"),
                  amount: summary.goalContributions,
                  color: "bg-green-400",
                },
                {
                  label: t("Savings"),
                  amount: Math.max(0, summary.savings),
                  color: "bg-emerald-400",
                },
              ].map(({ label, amount, color }) => {
                const pct =
                  summary.income > 0 ? (amount / summary.income) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium text-gray-800">
                        {formatCurrency(amount)}{" "}
                        <span className="text-gray-400 font-normal">
                          ({pct.toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${color}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">{t("Quick Actions")}</h2>
          <div className="space-y-2">
            {[
              { href: "/income", label: t("Set income for this month"), desc: t("Record your earnings") },
              { href: "/recurring", label: t("Manage recurring expenses"), desc: t("Bills, subscriptions, insurance") },
              { href: "/expenses", label: t("Add an expense"), desc: t("Dinners, shopping, etc.") },
              { href: "/goals", label: t("Contribute to a goal"), desc: t("Track your savings targets") },
            ].map(({ href, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <ArrowRight
                  size={16}
                  className="text-gray-300 group-hover:text-indigo-500 transition-colors"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Goals Overview */}
      {goals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">{t("Savings Goals")}</h2>
            <Link
              href="/goals"
              className="text-sm text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
            >
              {t("View all")} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.slice(0, 3).map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
