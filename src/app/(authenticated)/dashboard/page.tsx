"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import {
  TrendingUp, TrendingDown, PiggyBank, Target,
  ChevronLeft, ChevronRight, ArrowRight,
} from "lucide-react";
import {
  currentMonthKey,
  formatMonthKey,
  getMonthlySummary,
  getSavingsGoals,
  type MonthlySummary,
  type SavingsGoal,
} from "@/lib/store";
import RecurringApplyPanel from "@/components/RecurringApplyPanel";
import { useTranslation } from "@/lib/i18n";
import { useCountUp } from "@/hooks/useCountUp";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
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

// ─────────────────────────────────────────────
// P3: Skeleton shimmer
// ─────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[#1a1d24] rounded-xl animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

function DashboardSkeleton() {
  return (
    <div aria-label="Caricamento in corso..." aria-busy="true">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#111318] border border-[#1a1d24] rounded-2xl p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-[#111318] border border-[#1a1d24] rounded-2xl p-5 space-y-4">
            <Skeleton className="h-4 w-36" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// P2 + P7: Stat card with stagger entrance
// ─────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  sub?: string;
  valueColor: string;
  iconColor: string;
  iconBg: string;
  icon: React.ReactNode;
  // P7: stagger index
  index: number;
  reduceMotion: boolean;
}

function StatCard({ label, value, sub, valueColor, iconColor, iconBg, icon, index, reduceMotion }: StatCardProps) {
  const [visible, setVisible] = useState(false);
  // Count the figure up from zero to its real value on first render — the
  // one authored motion moment for this pass, tied to "watching your money
  // add up". Skips straight to the final value when reduceMotion is set.
  const animatedValue = useCountUp(value, reduceMotion);

  useEffect(() => {
    // P7: stagger-sequence — 50ms per card, skip if prefers-reduced-motion
    const delay = reduceMotion ? 0 : index * 50;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [index, reduceMotion]);

  return (
    <div
      className={`
        bg-[#111318] border border-[#1a1d24] rounded-2xl p-5
        transition-all duration-300
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-[#9ca3af] font-medium">{label}</p>
        {/* P1: icon is decorative */}
        <div
          className="w-8 h-8 rounded-[22%] flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
          aria-hidden="true"
        >
          <div style={{ color: iconColor }}>{icon}</div>
        </div>
      </div>
      {/* P6: tabular-nums for financial values */}
      <p className={`text-2xl font-bold tabular-nums tracking-tight ${valueColor}`}>{formatCurrency(animatedValue)}</p>
      {sub && <p className="text-xs text-[#9ca3af] mt-1">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Goal card
// ─────────────────────────────────────────────
function GoalCard({ goal, reduceMotion }: { goal: SavingsGoal; reduceMotion: boolean }) {
  const { t } = useTranslation();
  const pct = Math.min(100, goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0);
  const remaining = goal.targetAmount - goal.currentAmount;
  const now = useMemo(() => new Date(), []);
  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - now.getTime()) / 86400000);

  return (
    // P2: active scale feedback for interactive card
    <div className="bg-[#111318] border border-[#1a1d24] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: goal.color }} aria-hidden="true" />
          <span className="text-sm font-semibold text-white truncate">{goal.name}</span>
        </div>
        <span className="text-xs text-[#9ca3af] shrink-0 ml-2">
          {daysLeft > 0 ? `${daysLeft}${t("d left")}` : t("Overdue")}
        </span>
      </div>

      {/* P7: smooth bar fill transition */}
      <div
        className="w-full bg-[#1a1d24] rounded-full h-1.5 mb-3 overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name}: ${Math.round(pct)}%`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: goal.color,
            transition: reduceMotion ? "none" : "width 600ms ease-out",
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-[#9ca3af]">
        <span>{formatCurrency(goal.currentAmount)} {t("saved")}</span>
        <span style={{ color: goal.color, fontWeight: 600 }}>{pct.toFixed(0)}%</span>
      </div>
      <p className="text-xs text-[#9ca3af] mt-1">{formatCurrency(remaining)} {t("to go")}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Breakdown bar with animated fill
// ─────────────────────────────────────────────
function BreakdownBar({
  label, amount, pct, color, index, reduceMotion,
}: {
  label: string; amount: string; pct: number; color: string; index: number; reduceMotion: boolean;
}) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    // P7: stagger bars by 80ms each
    const delay = reduceMotion ? 0 : 200 + index * 80;
    const timer = setTimeout(() => setFilled(true), delay);
    return () => clearTimeout(timer);
  }, [index, reduceMotion]);

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-[#9ca3af]">{label}</span>
        <span className="text-[#e5e7eb] tabular-nums">
          {amount} <span className="text-[#9ca3af]">({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div
        className="w-full bg-[#1a1d24] rounded-full h-1.5 overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${Math.round(pct)}%`}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: filled ? `${Math.max(pct, 0.5)}%` : "0%",
            backgroundColor: color,
            transition: reduceMotion ? "none" : "width 500ms ease-out",
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Dashboard page
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  // P7: respect prefers-reduced-motion
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
  let cancelled = false;

  async function load() {
    const [s, g] = await Promise.all([
      getMonthlySummary(monthKey),
      getSavingsGoals(),
    ]);
    if (!cancelled) {
      setSummary(s);
      setGoals(g);
      setLoading(false);
    }
  }

  load();

  return () => { cancelled = true; };
}, [monthKey]);

  const pct = (amount: number) => summary && summary.income > 0
    ? (amount / summary.income) * 100
    : 0;

  const savingsColor = summary && summary.savings >= 0 ? "text-[#00FFA3]" : "text-red-400";

  return (
    // P5: full height, scrollable main
    <div className="flex-1 p-6 lg:p-8 max-w-6xl w-full mx-auto">

      {/* Page header — stacks on narrow screens so the month selector doesn't get squeezed against the title */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t("Dashboard")}</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">{t("Your monthly financial overview")}</p>
        </div>

        {/* Month selector — P2: larger touch targets */}
        <div
          className="flex items-center gap-1 bg-[#111318] border border-[#1a1d24] rounded-xl px-2 py-1 w-fit"
          role="group"
          aria-label={t("Month navigation")}
        >
          <button
            onClick={() => setMonthKey(addMonths(monthKey, -1))}
            // P2: 44×44px touch target
            className="w-11 h-11 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1a1d24] transition-colors cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
            aria-label={t("Previous month")}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span
            className="text-sm font-semibold text-white min-w-[120px] text-center tabular-nums select-none"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatMonthKey(monthKey, locale)}
          </span>
          <button
            onClick={() => setMonthKey(addMonths(monthKey, 1))}
            className="w-11 h-11 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1a1d24] transition-colors cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
            aria-label={t("Next month")}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* P3: skeleton while loading, real content after */}
      {loading ? (
        <DashboardSkeleton />
      ) : summary ? (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              index={0} reduceMotion={reduceMotion}
              label={t("Income")}
              value={summary.income}
              valueColor="text-[#00FFA3]"
              iconColor="#00FFA3" iconBg="#00FFA320"
              icon={<TrendingUp size={16} />}
            />
            <StatCard
              index={1} reduceMotion={reduceMotion}
              label={t("Total Expenses")}
              value={summary.oneTimeExpenses}
              valueColor="text-red-400"
              iconColor="#f87171" iconBg="#f8717120"
              icon={<TrendingDown size={16} />}
            />
            <StatCard
              index={2} reduceMotion={reduceMotion}
              label={t("Goal Contributions")}
              value={summary.goalContributions}
              valueColor="text-indigo-400"
              iconColor="#818cf8" iconBg="#818cf820"
              icon={<Target size={16} />}
            />
            <StatCard
              index={3} reduceMotion={reduceMotion}
              label={t("Net Savings")}
              value={summary.savings}
              // Goal contributions are money the user set aside on purpose —
              // still theirs, so they're not subtracted from Net Savings above,
              // just called out here so it's clear it's already earmarked.
              sub={summary.goalContributions > 0
                ? `${t("of which")} ${formatCurrency(summary.goalContributions)} ${t("set aside for goals")}`
                : undefined}
              valueColor={savingsColor}
              iconColor={summary.savings >= 0 ? "#00FFA3" : "#f87171"}
              iconBg={summary.savings >= 0 ? "#00FFA320" : "#f8717120"}
              icon={<PiggyBank size={16} />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

            {/* Top-left: Apply recurring panel (always visible) */}
            <div className="bg-[#111318] border border-[#1a1d24] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">{t("Apply Recurring Expenses")}</h2>
              <RecurringApplyPanel
                monthKey={monthKey}
                onApplied={async () => {
                  setLoading(true);
                  const s = await getMonthlySummary(monthKey);
                  setSummary(s);
                  setLoading(false);
                }}
              />
            </div>

            {/* Top-right: Breakdown */}
            <div className="bg-[#111318] border border-[#1a1d24] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-1">{t("Expense Breakdown")}</h2>
              {/* P2: each bar is an independent % of income, not a 100%-stacked
                  breakdown — without this label the four "(X%)" figures read
                  as parts of one whole and can visibly sum past 100%. */}
              <p className="text-xs text-[#9ca3af] mb-4">{t("Each row shown as % of income")}</p>
              {summary.income === 0 && summary.totalExpenses === 0 ? (
                // P8: empty state with action
                <div className="py-8 text-center">
                  <p className="text-sm text-[#9ca3af] mb-3">{t("No data for this month yet.")}</p>
                  <Link
                    href="/income"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00FFA3] hover:text-[#00ffb3] transition-colors"
                  >
                    {t("Add income")} <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <>
                  <BreakdownBar index={0} reduceMotion={reduceMotion} label={t("Recurring Expenses")}   amount={formatCurrency(summary.recurringExpenses)}  pct={pct(summary.recurringExpenses)}  color="#fb923c" />
                  <BreakdownBar index={1} reduceMotion={reduceMotion} label={t("One-time Expenses")}    amount={formatCurrency(summary.oneTimeExpenses)}     pct={pct(summary.oneTimeExpenses)}    color="#f87171" />
                  <BreakdownBar index={2} reduceMotion={reduceMotion} label={t("Goal Contributions")}   amount={formatCurrency(summary.goalContributions)}   pct={pct(summary.goalContributions)}  color="#818cf8" />
                  <BreakdownBar index={3} reduceMotion={reduceMotion} label={t("Savings")}              amount={formatCurrency(Math.max(0, summary.savings))} pct={pct(Math.max(0, summary.savings))} color="#00FFA3" />
                </>
              )}
            </div>
            
          </div>

          {/* Bottom-right: Goals overview */}
          <div className="bg-[#111318] border border-[#1a1d24] rounded-2xl p-5">
            {goals.length > 0 && (
              <section aria-labelledby="goals-heading">
                <div className="flex items-center justify-between mb-4">
                  <h2 id="goals-heading" className="text-sm font-semibold text-white">
                    {t("Savings Goals")}
                  </h2>
                  <Link
                    href="/goals"
                    className="text-xs text-[#00FFA3] hover:text-[#00ffb3] flex items-center gap-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3] rounded"
                  >
                    {t("View all")} <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goals.slice(0, 3).map((goal) => (
                    <GoalCard key={goal.id} goal={goal} reduceMotion={reduceMotion} />
                  ))}
                </div>
              </section>
            )}
          </div>
          
        </>
      ) : null}
      {/* Recurring apply is now embedded in the dashboard grid */}
    </div>
  );
}