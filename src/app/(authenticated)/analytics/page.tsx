"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import {
  currentMonthKey,
  formatMonthKey,
  getIncomes,
  getOneTimeExpenses,
  getGoalContributions,
  getSavingsGoals,
  type MonthlyIncome,
  type OneTimeExpense,
  type GoalContribution,
  type SavingsGoal,
} from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

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

// Bare grouped integer — used for the small value labels above chart columns,
// where a full "€ 1.234,56" would collide with its neighbour on a phone.
function formatCompact(amount: number): string {
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 }).format(amount);
}

function addMonths(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────
// Period model
// "1" / "3" / "6" / "12" are rolling windows that END at the current month
// (so the newest, possibly partial, data is always included); "year" is a
// calendar year picked with the ‹ 2026 › stepper and always spans Jan–Dec.
// ─────────────────────────────────────────────
type Preset = "1" | "3" | "6" | "12" | "year";

const PRESETS: Array<{ id: Preset; short: string; labelKey: string }> = [
  { id: "1", short: "1M", labelKey: "Last month" },
  { id: "3", short: "3M", labelKey: "Last 3 months" },
  { id: "6", short: "6M", labelKey: "Last 6 months" },
  { id: "12", short: "12M", labelKey: "Last 12 months" },
  { id: "year", short: "", labelKey: "Year" },
];

function buildMonthKeys(preset: Preset, year: number, nowKey: string): string[] {
  if (preset === "year") {
    return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  }
  const n = Number(preset);
  return Array.from({ length: n }, (_, i) => addMonths(nowKey, i - (n - 1)));
}

// ─────────────────────────────────────────────
// Category palette — one hue (the app's negative/expense tone) stepped down in
// intensity, so the donut reads as "expenses" and stays inside the design
// system instead of introducing a rainbow. Anything past the top six, and the
// "other" bucket, falls back to the neutral faint ink.
// ─────────────────────────────────────────────
const TOP_CATEGORIES = 6;
const CATEGORY_SHADES = [100, 78, 60, 46, 35, 27];
const COLOR_OTHER = "var(--ink-faint)";

function categoryColor(rank: number): string {
  if (rank >= TOP_CATEGORIES) return COLOR_OTHER;
  return `color-mix(in oklab, var(--negative) ${CATEGORY_SHADES[rank]}%, var(--surface-sunken))`;
}

const COLOR_INCOME = "var(--accent)";
const COLOR_EXPENSE = "var(--negative)";

// ─────────────────────────────────────────────
// Aggregation
// ─────────────────────────────────────────────
interface MonthDatum {
  monthKey: string;
  income: number;
  expenses: number;
}

interface CategoryDatum {
  category: string;
  amount: number;
}

interface GoalDatum {
  id: string;
  name: string;
  color: string;
  amount: number;
}

function aggregate(
  monthKeys: string[],
  incomes: MonthlyIncome[],
  expenses: OneTimeExpense[],
  contributions: GoalContribution[],
  goals: SavingsGoal[],
  deletedGoalLabel: string
) {
  const inRange = new Set(monthKeys);

  const months: MonthDatum[] = monthKeys.map((mk) => ({
    monthKey: mk,
    income: incomes.filter((i) => i.monthKey === mk).reduce((s, i) => s + i.amount, 0),
    expenses: expenses.filter((e) => e.monthKey === mk).reduce((s, e) => s + e.amount, 0),
  }));

  const totalIncome = months.reduce((s, m) => s + m.income, 0);
  const totalExpenses = months.reduce((s, m) => s + m.expenses, 0);

  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    if (!inRange.has(e.monthKey)) continue;
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  }
  const categories: CategoryDatum[] = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category));

  const goalById = new Map(goals.map((g) => [g.id, g]));
  const byGoal = new Map<string, GoalDatum>();
  for (const c of contributions) {
    if (!inRange.has(c.monthKey)) continue;
    const goal = goalById.get(c.goalId);
    const existing = byGoal.get(c.goalId);
    if (existing) existing.amount += c.amount;
    else
      byGoal.set(c.goalId, {
        id: c.goalId,
        name: goal?.name ?? deletedGoalLabel,
        color: goal?.color ?? "var(--ink-faint)",
        amount: c.amount,
      });
  }
  const goalData = [...byGoal.values()].sort((a, b) => b.amount - a.amount);
  const totalGoals = goalData.reduce((s, g) => s + g.amount, 0);

  return { months, totalIncome, totalExpenses, categories, goalData, totalGoals };
}

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-sunken rounded-md animate-pulse ${className}`} aria-hidden="true" />;
}

function AnalyticsSkeleton() {
  return (
    <div aria-busy="true" className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <SkeletonBlock key={i} className="h-16" />
        ))}
      </div>
      <SkeletonBlock className="h-64 w-full" />
      <div className="flex flex-col lg:flex-row gap-8">
        <SkeletonBlock className="w-52 h-52 rounded-full mx-auto shrink-0" />
        <div className="flex-1 space-y-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonBlock key={i} className="h-8" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section heading — same ledger-column microlabel as the dashboard.
// ─────────────────────────────────────────────
function SectionHeading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xs font-mono font-semibold uppercase tracking-widest text-ink-faint">
      {children}
    </h2>
  );
}

// ─────────────────────────────────────────────
// KPI cell — label over figure. The grid around these uses a 1px gap on a
// hairline background to draw the dividers, so any column count stays tidy.
// ─────────────────────────────────────────────
function Kpi({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative" | "goal";
  hint?: string;
}) {
  const toneClass =
    tone === "positive" ? "text-accent" : tone === "negative" ? "text-negative" : tone === "goal" ? "text-goal" : "text-ink";
  return (
    <div className="bg-surface px-5 py-4 min-w-0">
      <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-ink-faint leading-snug">
        {label}
      </p>
      <p className={`mt-1.5 text-lg sm:text-xl font-mono font-bold tabular-nums truncate ${toneClass}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-muted truncate">{hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Cash-flow chart — paired columns (income / expenses) per month. Built from
// plain flex boxes rather than a scaled SVG so the month labels stay a real,
// legible size on phones even with twelve columns. Values print above the
// bars only when there are few enough columns for them not to collide.
// ─────────────────────────────────────────────
function CashFlowChart({
  data,
  currentKey,
  locale,
  t,
}: {
  data: MonthDatum[];
  currentKey: string;
  locale: string;
  t: (k: string) => string;
}) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expenses]), 0);
  const showValues = data.length <= 6;
  // With up to 3 columns there is room for the full figure; at 6 the pair of
  // labels has to fit in ~55px on a phone, so thousands collapse to "2,4k".
  const valueLabel = (v: number) =>
    data.length <= 3 || v < 1000
      ? formatCompact(v)
      : `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(v / 1000)}k`;
  const monthShort = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(y, m - 1, 1)).replace(".", "");
  };
  const showYear = (key: string, index: number) => index === 0 || key.endsWith("-01");

  const ariaLabel = `${t("Income vs Expenses")}. ${data
    .map((d) => `${formatMonthKey(d.monthKey, locale)}: ${t("Income")} ${formatCurrency(d.income)}, ${t("Expenses")} ${formatCurrency(d.expenses)}`)
    .join("; ")}`;

  return (
    <div>
      <div className="flex items-center gap-5 mb-4 text-xs text-ink-muted">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLOR_INCOME }} aria-hidden="true" />
          {t("Income")}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLOR_EXPENSE }} aria-hidden="true" />
          {t("Expenses")}
        </span>
      </div>

      <div
        role="img"
        aria-label={ariaLabel}
        className="flex items-stretch gap-1 sm:gap-3 h-56 sm:h-72 pt-6 border-b border-hairline"
      >
        {data.map((d) => (
          <div
            key={d.monthKey}
            className="flex-1 min-w-0 flex items-stretch justify-center gap-[3px] sm:gap-1.5"
            title={`${formatMonthKey(d.monthKey, locale)} — ${t("Income")}: ${formatCurrency(d.income)} · ${t("Expenses")}: ${formatCurrency(d.expenses)}`}
          >
            {[
              { value: d.income, color: COLOR_INCOME },
              { value: d.expenses, color: COLOR_EXPENSE },
            ].map((bar, i) => {
              const pct = max > 0 ? (bar.value / max) * 100 : 0;
              return (
                <div key={i} className="relative flex-1 max-w-12 sm:max-w-14">
                  <div
                    className="absolute bottom-0 inset-x-0 rounded-t-[3px] transition-[height] duration-500 ease-out motion-reduce:transition-none"
                    style={{ height: `${pct}%`, backgroundColor: bar.color, minHeight: bar.value > 0 ? 2 : 0 }}
                  />
                  {showValues && bar.value > 0 && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap text-[9px] sm:text-[11px] font-mono tabular-nums text-ink-muted"
                      style={{ bottom: `${pct}%` }}
                      aria-hidden="true"
                    >
                      {valueLabel(bar.value)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex gap-1 sm:gap-3 mt-2" aria-hidden="true">
        {data.map((d, index) => (
          <div key={d.monthKey} className="flex-1 min-w-0 text-center">
            <p
              className={`text-[10px] sm:text-xs font-mono capitalize ${
                d.monthKey === currentKey ? "text-ink font-semibold" : "text-ink-faint"
              }`}
            >
              {monthShort(d.monthKey)}
            </p>
            <p className="text-[9px] sm:text-[10px] font-mono text-ink-faint h-3">
              {showYear(d.monthKey, index) ? d.monthKey.slice(0, 4) : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Donut — stroke-based inline SVG arcs with a centred total, flat, no
// gradients. Decorative (aria-hidden): the category list beside it carries the
// same figures as text.
// ─────────────────────────────────────────────
interface DonutSegment {
  id: string;
  value: number;
  color: string;
}

function Donut({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: DonutSegment[];
  centerLabel: string;
  centerValue: string;
}) {
  const size = 240;
  const strokeWidth = 28;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  // A hair of empty stroke between wedges so adjacent shades never blur together.
  const gap = segments.filter((s) => s.value > 0).length > 1 ? 2 : 0;

  const arcs = segments.reduce<Array<DonutSegment & { length: number; offset: number }>>((acc, seg) => {
    const length = total > 0 ? (seg.value / total) * circumference : 0;
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].length : 0;
    return [...acc, { ...seg, length, offset }];
  }, []);

  return (
    <div className="relative w-[200px] sm:w-[240px] shrink-0 mx-auto" aria-hidden="true">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--hairline)" strokeWidth={strokeWidth} />
        {total > 0 && (
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {arcs.map((arc) =>
              arc.length > 0.01 ? (
                <circle
                  key={arc.id}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  strokeWidth={strokeWidth}
                  style={{ stroke: arc.color }}
                  strokeDasharray={`${Math.max(arc.length - gap, 0.01)} ${circumference - Math.max(arc.length - gap, 0.01)}`}
                  strokeDashoffset={-arc.offset}
                />
              ) : null
            )}
          </g>
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-ink-faint">
          {centerLabel}
        </span>
        <span className="mt-1 text-base sm:text-lg font-mono font-bold tabular-nums text-ink">{centerValue}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Ranked row — dot, label, share, amount and a thin proportional bar. Used for
// both the category list and the per-goal list.
// ─────────────────────────────────────────────
function RankedRow({
  label,
  amount,
  share,
  color,
}: {
  label: string;
  amount: number;
  share: number;
  color: string;
}) {
  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
          <span className="text-sm text-ink truncate">{label}</span>
        </div>
        <div className="flex items-baseline gap-2 shrink-0">
          <span className="text-xs font-mono text-ink-faint tabular-nums">{share.toFixed(0)}%</span>
          <span className="text-sm font-mono font-semibold text-ink tabular-nums">{formatCurrency(amount)}</span>
        </div>
      </div>
      <div className="mt-2 h-1 rounded-full bg-surface-sunken overflow-hidden" aria-hidden="true">
        <div className="h-full rounded-full" style={{ width: `${Math.max(share, 0)}%`, backgroundColor: color }} />
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────
// Analytics page
// ─────────────────────────────────────────────
export default function AnalyticsPage() {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const nowKey = useMemo(() => currentMonthKey(), []);
  const currentYear = Number(nowKey.split("-")[0]);

  const [preset, setPreset] = useState<Preset>("6");
  const [year, setYear] = useState(currentYear);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [incomes, setIncomes] = useState<MonthlyIncome[]>([]);
  const [expenses, setExpenses] = useState<OneTimeExpense[]>([]);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [inc, exp, con, gl] = await Promise.all([
          getIncomes(),
          getOneTimeExpenses(),
          getGoalContributions(),
          getSavingsGoals(),
        ]);
        if (cancelled) return;
        setIncomes(inc);
        setExpenses(exp);
        setContributions(con);
        setGoals(gl);
      } catch {
        if (!cancelled) setLoadError(t("Failed to load analytics."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // Load once: every period change is aggregated client-side from the same data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Earliest year that holds any data — the year stepper never goes before it.
  const minYear = useMemo(() => {
    const years = [
      ...incomes.map((i) => Number(i.monthKey.slice(0, 4))),
      ...expenses.map((e) => Number(e.monthKey.slice(0, 4))),
      ...contributions.map((c) => Number(c.monthKey.slice(0, 4))),
    ].filter((y) => Number.isFinite(y));
    return Math.min(currentYear, ...years);
  }, [incomes, expenses, contributions, currentYear]);

  const monthKeys = useMemo(() => buildMonthKeys(preset, year, nowKey), [preset, year, nowKey]);

  const { months, totalIncome, totalExpenses, categories, goalData, totalGoals } = useMemo(
    () => aggregate(monthKeys, incomes, expenses, contributions, goals, t("Deleted goal")),
    [monthKeys, incomes, expenses, contributions, goals, t]
  );

  // Per-month averages only count months that have actually started — in the
  // current year the future months are empty and would drag the average down.
  const elapsedMonths = Math.max(1, monthKeys.filter((mk) => mk <= nowKey).length);
  const avgMonthlySpending = totalExpenses / elapsedMonths;
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : null;

  const rangeLabel =
    preset === "year"
      ? String(year)
      : monthKeys.length === 1
        ? formatMonthKey(monthKeys[0], locale)
        : `${formatMonthKey(monthKeys[0], locale)} – ${formatMonthKey(monthKeys[monthKeys.length - 1], locale)}`;

  const hasAnyData = totalIncome > 0 || totalExpenses > 0 || totalGoals > 0;

  // Donut + collapsed list: top N, remainder summed into one "Other categories" row.
  const topCategories = categories.slice(0, TOP_CATEGORIES);
  const restCategories = categories.slice(TOP_CATEGORIES);
  const restTotal = restCategories.reduce((s, c) => s + c.amount, 0);
  const donutSegments: DonutSegment[] = [
    ...topCategories.map((c, i) => ({ id: c.category, value: c.amount, color: categoryColor(i) })),
    ...(restTotal > 0 ? [{ id: "__other", value: restTotal, color: COLOR_OTHER }] : []),
  ];
  const shareOfExpenses = (amount: number) => (totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0);
  const shareOfGoals = (amount: number) => (totalGoals > 0 ? (amount / totalGoals) * 100 : 0);

  const listedCategories = showAllCategories ? categories : topCategories;

  function selectPreset(next: Preset) {
    setPreset(next);
    setShowAllCategories(false);
  }

  return (
    <div className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
      <div className="bg-surface border border-hairline rounded-lg overflow-hidden divide-y divide-hairline">
        {/* Header */}
        <section className="p-6 lg:p-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:opacity-80 transition-opacity mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            <ArrowLeft size={13} aria-hidden="true" /> {t("Back to dashboard")}
          </Link>
          <h1 className="text-2xl font-bold text-ink tracking-tight">{t("Analytics")}</h1>
          <p className="text-sm text-ink-muted mt-0.5">{t("Statistics across months and years")}</p>
        </section>

        {/* Period selector */}
        <section className="px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4" aria-label={t("Period")}>
          <div
            className="flex bg-surface-sunken border border-hairline rounded-lg p-1 w-full sm:w-fit"
            role="tablist"
            aria-label={t("Period")}
          >
            {PRESETS.map((p) => {
              const active = preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={t(p.labelKey)}
                  tabIndex={active ? 0 : -1}
                  onClick={() => selectPreset(p.id)}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    active ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {p.id === "year" ? t("Year") : p.short}
                </button>
              );
            })}
          </div>

          {preset === "year" && (
            <div
              className="flex items-center bg-surface-sunken border border-hairline rounded-lg w-full sm:w-auto overflow-hidden"
              role="group"
              aria-label={t("Year")}
            >
              <button
                type="button"
                onClick={() => setYear((y) => y - 1)}
                disabled={year <= minYear}
                aria-label={t("Previous year")}
                className="flex items-center justify-center w-11 h-10 text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <span
                className="flex-1 sm:flex-none sm:min-w-[96px] text-center font-mono font-semibold text-ink tabular-nums select-none"
                aria-live="polite"
                aria-atomic="true"
              >
                {year}
              </span>
              <button
                type="button"
                onClick={() => setYear((y) => y + 1)}
                disabled={year >= currentYear}
                aria-label={t("Next year")}
                className="flex items-center justify-center w-11 h-10 text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* In year mode the stepper already shows the year, so the range label would just repeat it. */}
          {preset !== "year" && (
            <p className="sm:ml-auto text-sm font-mono text-ink-muted tabular-nums" aria-live="polite">
              {rangeLabel}
            </p>
          )}
        </section>

        {loadError && (
          <div className="p-6 lg:p-8">
            <ErrorBanner message={loadError} />
          </div>
        )}

        {loading ? (
          <div className="p-6 lg:p-8">
            <AnalyticsSkeleton />
          </div>
        ) : !loadError ? (
          <>
            {/* Summary strip */}
            <section aria-label={t("Analytics")}>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-px bg-hairline">
                <Kpi label={t("Total Income")} value={formatCurrency(totalIncome)} tone="positive" />
                <Kpi label={t("Total Expenses")} value={formatCurrency(totalExpenses)} tone="negative" />
                <Kpi
                  label={t("Net Savings")}
                  value={formatCurrency(netSavings)}
                  tone={netSavings >= 0 ? "positive" : "negative"}
                />
                <Kpi
                  label={t("Savings Rate")}
                  value={savingsRate === null ? "—" : `${savingsRate.toFixed(1)}%`}
                  tone={savingsRate !== null && savingsRate < 0 ? "negative" : "default"}
                />
                <Kpi label={t("Avg Monthly Spending")} value={formatCurrency(avgMonthlySpending)} />
                <Kpi label={t("Set Aside for Goals")} value={formatCurrency(totalGoals)} tone="goal" />
              </div>
            </section>

            {!hasAnyData && (
              <section className="p-6 lg:p-8">
                <p className="text-sm text-ink-muted">{t("No data for this period.")}</p>
              </section>
            )}

            {/* Income vs Expenses */}
            <section className="p-6 lg:p-8" aria-labelledby="cashflow-heading">
              <div className="mb-5">
                <SectionHeading id="cashflow-heading">{t("Income vs Expenses")}</SectionHeading>
              </div>
              <CashFlowChart data={months} currentKey={nowKey} locale={locale} t={t} />
            </section>

            {/* Expenses by category */}
            <section className="p-6 lg:p-8" aria-labelledby="categories-heading">
              <div className="mb-5">
                <SectionHeading id="categories-heading">{t("Expenses by Category")}</SectionHeading>
              </div>

              {categories.length === 0 ? (
                <p className="text-sm text-ink-muted">{t("No expenses in this period.")}</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-14 items-start">
                  <Donut
                    segments={donutSegments}
                    centerLabel={t("Total Expenses")}
                    centerValue={formatCurrency(totalExpenses)}
                  />
                  <div className="min-w-0">
                    <ul className="divide-y divide-hairline">
                      {listedCategories.map((c, i) => (
                        <RankedRow
                          key={c.category}
                          label={t(c.category)}
                          amount={c.amount}
                          share={shareOfExpenses(c.amount)}
                          color={categoryColor(i)}
                        />
                      ))}
                      {!showAllCategories && restTotal > 0 && (
                        <RankedRow
                          key="__other"
                          label={t("Other categories")}
                          amount={restTotal}
                          share={shareOfExpenses(restTotal)}
                          color={COLOR_OTHER}
                        />
                      )}
                    </ul>
                    {restCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllCategories((v) => !v)}
                        aria-expanded={showAllCategories}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                      >
                        {showAllCategories ? t("Show less") : `${t("Show all")} (${categories.length})`}
                        <ChevronDown
                          size={13}
                          aria-hidden="true"
                          className={`transition-transform ${showAllCategories ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Goal contributions */}
            <section className="p-6 lg:p-8" aria-labelledby="goals-heading">
              <div className="mb-5">
                <SectionHeading id="goals-heading">{t("Contributions by Goal")}</SectionHeading>
              </div>
              {goalData.length === 0 ? (
                <p className="text-sm text-ink-muted">{t("No goal contributions in this period.")}</p>
              ) : (
                <ul className="divide-y divide-hairline lg:max-w-3xl">
                  {goalData.map((g) => (
                    <RankedRow key={g.id} label={g.name} amount={g.amount} share={shareOfGoals(g.amount)} color={g.color} />
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
