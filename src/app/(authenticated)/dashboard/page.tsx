"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import {
  currentMonthKey,
  formatMonthKey,
  getMonthlySummary,
  getSavingsGoals,
  previewRecurringForMonth,
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

// The four ledger-page wedges. Income and Goal Contributions each have a
// dedicated semantic token already (--accent, --goal); One-time Expenses
// reuses --negative. "Recurring still to apply" is new to this view and has
// no token of its own — rather than adding one, it's derived as a muted
// blend of the existing negative + ink-faint tokens (a faded, not-yet-real
// expense), so it stays visually distinct from all three without touching
// globals.css.
const COLOR_INCOME = "var(--accent)";
const COLOR_ONE_TIME = "var(--negative)";
const COLOR_RECURRING_PENDING = "color-mix(in oklab, var(--ink-faint) 55%, var(--negative) 45%)";
const COLOR_GOAL = "var(--goal)";

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-sunken rounded-md animate-pulse ${className}`} aria-hidden="true" />;
}

function DashboardSkeleton() {
  return (
    <div aria-label="Caricamento in corso..." aria-busy="true" className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center gap-10">
        <SkeletonBlock className="w-48 h-48 rounded-full mx-auto lg:mx-0 shrink-0" />
        <div className="flex-1 w-full space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <SkeletonBlock className="h-3 w-32" />
              <SkeletonBlock className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
      <SkeletonBlock className="h-14 w-64 mx-auto" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Month scrub control — a persistent drag/swipe surface for moving between
// months (pointer events cover both mouse-drag and touch-swipe). The label
// follows the drag with resistance and always resolves to a real month on
// release (snap to nearest whole month, or snap back to the current one).
// Chevron buttons remain as an always-available click/keyboard fallback —
// the drag is additive, never a replacement for them. Arrow keys work when
// the scrub surface itself is focused too.
// ─────────────────────────────────────────────
const MONTH_DRAG_STEP_PX = 56;
const MONTH_DRAG_RESISTANCE = 0.5;
const MONTH_DRAG_VISUAL_CLAMP = 96;

function MonthScrub({
  label,
  onPrev,
  onNext,
  onScrub,
  groupLabel,
  prevLabel,
  nextLabel,
  scrubHint,
  reduceMotion,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onScrub: (deltaMonths: number) => void;
  groupLabel: string;
  prevLabel: string;
  nextLabel: string;
  scrubHint: string;
  reduceMotion: boolean;
}) {
  const dragInfo = useRef<{ pointerId: number; startX: number } | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const resolveDrag = useCallback(
    (commit: boolean) => {
      if (commit) {
        const delta = Math.round(dragX / MONTH_DRAG_STEP_PX);
        if (delta !== 0) onScrub(delta);
      }
      dragInfo.current = null;
      setDragging(false);
      setDragX(0);
    },
    [dragX, onScrub]
  );

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragInfo.current = { pointerId: e.pointerId, startX: e.clientX };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const info = dragInfo.current;
    if (!info || info.pointerId !== e.pointerId) return;
    setDragX(e.clientX - info.startX);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const info = dragInfo.current;
    if (!info || info.pointerId !== e.pointerId) return;
    resolveDrag(true);
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLDivElement>) {
    const info = dragInfo.current;
    if (!info || info.pointerId !== e.pointerId) return;
    // Ambiguous end (e.g. pointer capture lost mid-gesture) — never leave
    // the control half-changed, always fall back to the current month.
    resolveDrag(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onNext();
    }
  }

  const visualOffset = reduceMotion
    ? 0
    : Math.max(-MONTH_DRAG_VISUAL_CLAMP, Math.min(MONTH_DRAG_VISUAL_CLAMP, dragX * MONTH_DRAG_RESISTANCE));

  return (
    <div
      className="flex items-stretch w-full sm:w-auto sm:min-w-[320px] bg-surface border border-hairline rounded-lg overflow-hidden shrink-0"
      role="group"
      aria-label={groupLabel}
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label={prevLabel}
        className="flex items-center justify-center w-12 sm:w-14 shrink-0 text-ink-muted hover:text-ink hover:bg-surface-sunken active:scale-95 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <div
        className={`flex-1 flex items-center justify-center border-x border-hairline px-4 py-3 min-w-[140px] select-none ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ touchAction: "pan-y" }}
        tabIndex={0}
        aria-label={scrubHint}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleKeyDown}
      >
        <span
          className="font-mono text-base sm:text-lg font-semibold text-ink tabular-nums text-center"
          style={{
            transform: `translateX(${visualOffset}px)`,
            transition: dragging || reduceMotion ? "none" : "transform 220ms ease-out",
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {label}
        </span>
      </div>
      <button
        type="button"
        onClick={onNext}
        aria-label={nextLabel}
        className="flex items-center justify-center w-12 sm:w-14 shrink-0 text-ink-muted hover:text-ink hover:bg-surface-sunken active:scale-95 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Donut chart — hand-rolled inline SVG, stroke-based arcs. Flat rendering,
// no gradients/shadows. Decorative (aria-hidden): the adjacent ValueRow
// list already gives the same figures as accessible text.
// ─────────────────────────────────────────────
interface DonutSegment {
  id: string;
  value: number;
  color: string;
}

function Donut({ segments, reduceMotion }: { segments: DonutSegment[]; reduceMotion: boolean }) {
  const [mounted, setMounted] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) return;
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion]);

  const size = 240;
  const strokeWidth = 26;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  const arcs = segments.reduce<Array<DonutSegment & { length: number; offset: number }>>(
    (acc, seg) => {
      const fraction = total > 0 ? seg.value / total : 0;
      const length = fraction * circumference;
      const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].length : 0;
      return [...acc, { ...seg, length, offset }];
    },
    []
  );

  return (
    <div
      className={`w-[190px] sm:w-[220px] lg:w-[240px] shrink-0 transition-all duration-500 ${
        mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"
      }`}
      aria-hidden="true"
    >
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
                  strokeDasharray={`${arc.length} ${circumference - arc.length}`}
                  strokeDashoffset={-arc.offset}
                />
              ) : null
            )}
          </g>
        )}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────
// Value row — one of the four always-shown ledger lines (label, %, amount).
// ─────────────────────────────────────────────
function ValueRow({
  label,
  amount,
  pct,
  color,
  index,
  reduceMotion,
}: {
  label: string;
  amount: number;
  pct: number;
  color: string;
  index: number;
  reduceMotion: boolean;
}) {
  const [visible, setVisible] = useState(reduceMotion);
  const animatedAmount = useCountUp(amount, reduceMotion);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setTimeout(() => setVisible(true), 150 + index * 70);
    return () => clearTimeout(timer);
  }, [index, reduceMotion]);

  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 transition-all duration-300 ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
        <span className="text-sm text-ink-muted truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-2 shrink-0">
        <span className="text-xs font-mono text-ink-faint tabular-nums">{pct.toFixed(0)}%</span>
        <span className="text-sm font-mono font-semibold text-ink tabular-nums">
          {formatCurrency(animatedAmount)}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Net savings — largest type on the page, can read negative.
// ─────────────────────────────────────────────
function NetSavingsBlock({
  value,
  goalContributions,
  reduceMotion,
  netSavingsLabel,
  ofWhichLabel,
  setAsideLabel,
}: {
  value: number;
  goalContributions: number;
  reduceMotion: boolean;
  netSavingsLabel: string;
  ofWhichLabel: string;
  setAsideLabel: string;
}) {
  const animated = useCountUp(value, reduceMotion);
  const positive = value >= 0;

  return (
    <div className="flex flex-col items-center text-center gap-1.5">
      <p className="text-xs font-mono font-semibold tracking-widest uppercase text-ink-faint">
        {netSavingsLabel}
      </p>
      <p
        className={`font-mono font-bold tabular-nums text-5xl sm:text-6xl leading-none ${
          positive ? "text-accent" : "text-negative"
        }`}
      >
        {formatCurrency(animated)}
      </p>
      {goalContributions > 0 && (
        <p className="text-sm text-ink-muted mt-1">
          {ofWhichLabel}{" "}
          <span className="font-mono tabular-nums text-ink">{formatCurrency(goalContributions)}</span>{" "}
          {setAsideLabel}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Goal card — a restrained nod to the "illustrated postcard" motif reserved
// for Savings Goals: a flat color band using the goal's own color, not a
// literal illustration.
// ─────────────────────────────────────────────
function GoalCard({ goal, reduceMotion, t }: { goal: SavingsGoal; reduceMotion: boolean; t: (k: string) => string }) {
  const pct = Math.min(100, goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0);
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const now = useMemo(() => new Date(), []);
  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - now.getTime()) / 86400000);

  return (
    <div className="rounded-lg border border-hairline bg-surface-sunken overflow-hidden">
      <div className="h-2" style={{ backgroundColor: goal.color }} aria-hidden="true" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: goal.color }} aria-hidden="true" />
            <span className="text-sm font-semibold text-ink truncate">{goal.name}</span>
          </div>
          <span className="text-xs text-ink-faint font-mono shrink-0 ml-2">
            {daysLeft > 0 ? `${daysLeft}${t("d left")}` : t("Overdue")}
          </span>
        </div>

        <div
          className="w-full bg-surface-sunken rounded-full h-1.5 mb-3 overflow-hidden"
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

        <div className="flex justify-between text-xs text-ink-muted font-mono tabular-nums">
          <span>
            {formatCurrency(goal.currentAmount)} {t("saved")}
          </span>
          <span style={{ color: goal.color, fontWeight: 600 }}>{pct.toFixed(0)}%</span>
        </div>
        <p className="text-xs text-ink-muted mt-1 font-mono tabular-nums">
          {formatCurrency(remaining)} {t("to go")}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section heading — shared "ledger column" microlabel treatment.
// ─────────────────────────────────────────────
function SectionHeading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xs font-mono font-semibold uppercase tracking-widest text-ink-faint">
      {children}
    </h2>
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
  const [recurringPending, setRecurringPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [s, g, recurringItems] = await Promise.all([
        getMonthlySummary(monthKey),
        getSavingsGoals(),
        previewRecurringForMonth(monthKey),
      ]);
      if (!cancelled) {
        setSummary(s);
        setGoals(g);
        setRecurringPending(
          recurringItems.filter((i) => !i.isApplied).reduce((sum, i) => sum + i.amount, 0)
        );
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [monthKey]);

  const totalFlow = summary
    ? summary.income + summary.oneTimeExpenses + recurringPending + summary.goalContributions
    : 0;
  const pctOf = (amount: number) => (totalFlow > 0 ? (amount / totalFlow) * 100 : 0);

  async function handleApplied() {
    setLoading(true);
    const [s, recurringItems] = await Promise.all([
      getMonthlySummary(monthKey),
      previewRecurringForMonth(monthKey),
    ]);
    setSummary(s);
    setRecurringPending(recurringItems.filter((i) => !i.isApplied).reduce((sum, i) => sum + i.amount, 0));
    setLoading(false);
  }

  return (
    <div className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
      <div className="bg-surface border border-hairline rounded-lg overflow-hidden divide-y divide-hairline">

        {/* Header + month scrub */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">{t("Dashboard")}</h1>
            <p className="text-sm text-ink-muted mt-0.5">{t("Your monthly financial overview")}</p>
          </div>
          <MonthScrub
            label={formatMonthKey(monthKey, locale)}
            onPrev={() => setMonthKey(addMonths(monthKey, -1))}
            onNext={() => setMonthKey(addMonths(monthKey, 1))}
            onScrub={(delta) => setMonthKey(addMonths(monthKey, delta))}
            groupLabel={t("Month navigation")}
            prevLabel={t("Previous month")}
            nextLabel={t("Next month")}
            scrubHint={t("Drag or use arrow keys to change month")}
            reduceMotion={reduceMotion}
          />
        </section>

        {loading ? (
          <div className="p-6 lg:p-8">
            <DashboardSkeleton />
          </div>
        ) : summary ? (
          <>
            {/* Overview: donut + value lists + net savings */}
            <section className="p-6 lg:p-8" aria-labelledby="overview-heading">
              <h2 id="overview-heading" className="sr-only">
                {t("Your monthly financial overview")}
              </h2>

              {totalFlow === 0 && (
                <div className="mb-6 flex items-center justify-between flex-wrap gap-3 rounded-md bg-surface-sunken px-4 py-3">
                  <p className="text-sm text-ink-muted">{t("No data for this month yet.")}</p>
                  <Link
                    href="/income"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    {t("Add income")} <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-12 items-center">
                <div className="divide-y divide-hairline order-2 lg:order-1">
                  <ValueRow
                    index={0}
                    reduceMotion={reduceMotion}
                    label={t("Income")}
                    amount={summary.income}
                    pct={pctOf(summary.income)}
                    color={COLOR_INCOME}
                  />
                  <ValueRow
                    index={1}
                    reduceMotion={reduceMotion}
                    label={t("One-time Expenses")}
                    amount={summary.oneTimeExpenses}
                    pct={pctOf(summary.oneTimeExpenses)}
                    color={COLOR_ONE_TIME}
                  />
                </div>

                <div className="order-1 lg:order-2 flex justify-center">
                  <Donut
                    reduceMotion={reduceMotion}
                    segments={[
                      { id: "income", value: summary.income, color: COLOR_INCOME },
                      { id: "oneTime", value: summary.oneTimeExpenses, color: COLOR_ONE_TIME },
                      { id: "recurringPending", value: recurringPending, color: COLOR_RECURRING_PENDING },
                      { id: "goalContributions", value: summary.goalContributions, color: COLOR_GOAL },
                    ]}
                  />
                </div>

                <div className="divide-y divide-hairline order-3">
                  <ValueRow
                    index={2}
                    reduceMotion={reduceMotion}
                    label={t("Recurring Still to Apply")}
                    amount={recurringPending}
                    pct={pctOf(recurringPending)}
                    color={COLOR_RECURRING_PENDING}
                  />
                  <ValueRow
                    index={3}
                    reduceMotion={reduceMotion}
                    label={t("Goal Contributions")}
                    amount={summary.goalContributions}
                    pct={pctOf(summary.goalContributions)}
                    color={COLOR_GOAL}
                  />
                </div>
              </div>

              <div className="border-t border-hairline mt-8 pt-7">
                <NetSavingsBlock
                  value={summary.savings}
                  goalContributions={summary.goalContributions}
                  reduceMotion={reduceMotion}
                  netSavingsLabel={t("Net Savings")}
                  ofWhichLabel={t("of which")}
                  setAsideLabel={t("set aside for goals")}
                />
              </div>
            </section>

            {/* Apply Recurring Expenses */}
            <section className="p-6 lg:p-8" aria-labelledby="recurring-apply-heading">
              <SectionHeading id="recurring-apply-heading">{t("Apply Recurring Expenses")}</SectionHeading>
              <div className="mt-4">
                <RecurringApplyPanel monthKey={monthKey} onApplied={handleApplied} />
              </div>
            </section>

            {/* Savings goals */}
            {goals.length > 0 && (
              <section className="p-6 lg:p-8" aria-labelledby="goals-heading">
                <div className="flex items-center justify-between mb-4">
                  <SectionHeading id="goals-heading">{t("Savings Goals")}</SectionHeading>
                  <Link
                    href="/goals"
                    className="text-xs text-accent hover:opacity-80 flex items-center gap-1 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    {t("View all")} <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goals.slice(0, 3).map((goal) => (
                    <GoalCard key={goal.id} goal={goal} reduceMotion={reduceMotion} t={t} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
