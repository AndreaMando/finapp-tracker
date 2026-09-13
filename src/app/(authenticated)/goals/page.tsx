"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Target, PlusCircle,
  ChevronDown, ChevronUp, History,
} from "lucide-react";
import {
  currentMonthKey,
  formatMonthKey,
  getSavingsGoals,
  addSavingsGoal,
  deleteSavingsGoal,
  getContributionsForGoal,
  addGoalContribution,
  deleteGoalContribution,
  GOAL_COLORS,
  type SavingsGoal,
  type GoalContribution,
} from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SealedBadge } from "@/components/ui/SealedBadge";
import { useTranslation } from "@/lib/i18n";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency", currency: "EUR", minimumFractionDigits: 2,
  }).format(amount);
}

// Deterministic seed derived from a goal's own id/name — same goal always
// renders the same illustration; different goals (even same color) vary.
function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let state = seed;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-sunken rounded-md animate-pulse ${className}`} aria-hidden="true" />;
}

function GoalsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Caricamento obiettivi...">
      <div className="bg-surface border border-hairline rounded-lg divide-y divide-hairline sm:divide-y-0 sm:divide-x sm:flex mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="px-5 py-3.5 sm:flex-1 space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-hairline rounded-lg overflow-hidden">
            <Skeleton className="h-20 w-full rounded-none" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-md" />
                <Skeleton className="h-16 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// New goal form
// ─────────────────────────────────────────────
interface NewGoalFormProps { onSave: () => void; onClose: () => void; }

function NewGoalForm({ onSave, onClose }: NewGoalFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<HTMLInputElement>(null);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t("Name is required.");
    const parsed = parseFloat(target);
    if (isNaN(parsed) || parsed <= 0) e.target = t("Enter a valid target amount.");
    if (!deadline) e.deadline = t("Deadline is required.");
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.name) { nameRef.current?.focus(); return; }
      if (errs.target) { targetRef.current?.focus(); return; }
      return;
    }
    setIsSubmitting(true);
    await addSavingsGoal(name.trim(), parseFloat(target), new Date(deadline), color);
    setIsSubmitting(false);
    onSave();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

      {/* Goal Name */}
      <div className="space-y-1.5">
        <label htmlFor="goal-name" className="block text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Goal Name")} <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          ref={nameRef} id="goal-name" type="text" value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
          placeholder={t("e.g. Emergency Fund, Vacation, New Laptop")}
          aria-required="true" aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={errors.name ? "goal-name-error" : undefined}
          autoFocus
          className="block w-full px-4 py-3 text-sm text-ink bg-surface-sunken border border-hairline rounded-md
                     placeholder-ink-faint transition-colors focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
        />
        {errors.name && <p id="goal-name-error" role="alert" className="text-[11px] text-negative mt-1">{errors.name}</p>}
      </div>

      {/* Target Amount */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="goal-target" className="block text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
            {t("Target Amount")} (€) <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <input
            ref={targetRef} id="goal-target" type="number" step="0.01" min="0" value={target}
            onChange={(e) => { setTarget(e.target.value); setErrors((p) => ({ ...p, target: "" })); }}
            placeholder="1000.00"
            aria-required="true" aria-invalid={errors.target ? "true" : undefined}
            aria-describedby={errors.target ? "goal-target-error" : undefined}
            className="block w-full px-4 py-3 text-sm font-mono tabular-nums text-ink bg-surface-sunken border border-hairline rounded-md
                       placeholder-ink-faint transition-colors focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent
                       [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {errors.target && <p id="goal-target-error" role="alert" className="text-[11px] text-negative mt-1">{errors.target}</p>}
        </div>

        {/* Deadline */}
        <div className="space-y-1.5">
          <label htmlFor="goal-deadline" className="block text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
            {t("Deadline")} <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <input
            id="goal-deadline"
            type="date"
            value={deadline}
            onChange={(e) => { setDeadline(e.target.value); setErrors((p) => ({ ...p, deadline: "" })); }}
            aria-required="true" aria-invalid={errors.deadline ? "true" : undefined}
            className="block w-full min-w-0 px-4 py-3 text-sm font-mono text-ink bg-surface-sunken border border-hairline rounded-md
                       transition-colors focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent cursor-pointer
                       [appearance:none] [&::-webkit-date-and-time-value]:text-left [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0
                       dark:[&::-webkit-calendar-picker-indicator]:invert"
          />
          {errors.deadline && <p role="alert" className="text-[11px] text-negative mt-1">{errors.deadline}</p>}
        </div>
      </div>

      {/* Color picker */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase">{t("Color")}</p>
        <div className="flex gap-2.5 flex-wrap" role="group" aria-label={t("Choose goal color")}>
          {GOAL_COLORS.map((c) => (
            <button
              key={c} type="button" onClick={() => setColor(c)}
              aria-label={`Colore ${c}`}
              aria-pressed={color === c}
              className="w-7 h-7 rounded-full transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              style={{
                backgroundColor: c,
                transform: color === c ? "scale(1.25)" : "scale(1)",
                boxShadow: color === c ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}` : "none",
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit" disabled={isSubmitting} aria-busy={isSubmitting}
          className="flex-1 py-3 rounded-md text-sm font-bold bg-accent hover:opacity-90 active:scale-[0.98] text-accent-contrast
                     transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
        >
          {t("Create Goal")}
        </button>
        <button
          type="button" onClick={onClose}
          className="flex-1 py-3 rounded-md text-sm font-semibold bg-surface-sunken hover:bg-hairline active:scale-[0.98] text-ink
                     transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
        >
          {t("Cancel")}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Contribute form
// ─────────────────────────────────────────────
interface ContributeFormProps { goal: SavingsGoal; onSave: () => void; onClose: () => void; }

function ContributeForm({ goal, onSave, onClose }: ContributeFormProps) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [monthKey] = useState(currentMonthKey());
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const remaining = goal.targetAmount - goal.currentAmount;
  const pct = Math.min(100, goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError(t("Enter a valid amount."));
      amountRef.current?.focus();
      return;
    }
    if (parsed > remaining) {
      setError(`${t("Max contribution is")} ${formatCurrency(remaining)}.`);
      amountRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    await addGoalContribution(goal.id, monthKey, parsed, note);
    setIsSubmitting(false);
    onSave();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

      {/* Goal preview */}
      <div className="bg-surface-sunken border border-hairline rounded-md p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: goal.color }} aria-hidden="true" />
          <span className="font-semibold text-ink text-sm">{goal.name}</span>
        </div>
        <div className="flex justify-between text-xs text-ink-muted mb-2">
          <span>{t("Saved:")} <span className="text-ink font-medium font-mono tabular-nums">{formatCurrency(goal.currentAmount)}</span></span>
          <span>{t("Remaining:")} <span className="text-ink font-medium font-mono tabular-nums">{formatCurrency(remaining)}</span></span>
        </div>
        <div
          className="w-full bg-hairline rounded-full h-1.5 overflow-hidden"
          role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}
        >
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label htmlFor="contrib-amount" className="block text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Amount to Add")} (€) <span className="text-accent" aria-hidden="true">*</span>
        </label>
        <input
          ref={amountRef} id="contrib-amount" type="number" step="0.01" min="0" max={remaining}
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          placeholder={`${t("Max")} ${formatCurrency(remaining)}`}
          aria-required="true" aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "contrib-amount-error" : undefined}
          autoFocus
          className="block w-full h-[46px] px-4 py-3 text-sm font-mono tabular-nums text-ink bg-surface-sunken border border-hairline rounded-md placeholder-ink-faint transition-colors focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
        />
        {error && <p id="contrib-amount-error" role="alert" className="text-[11px] text-negative mt-1">{error}</p>}
      </div>

      {/* Month (read-only) */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase">{t("Month")}</p>
        <p className="text-sm font-mono text-ink bg-surface-sunken border border-hairline rounded-md px-4 py-3 h-[46px] flex items-center">
          {formatMonthKey(monthKey, locale)}
        </p>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label htmlFor="contrib-note" className="block text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase">
          {t("Note (optional)")}
        </label>
        <input
          id="contrib-note" type="text" value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("e.g. Monthly savings transfer")}
          className="block w-full h-[46px] px-4 py-3 text-sm text-ink bg-surface-sunken border border-hairline rounded-md placeholder-ink-faint transition-colors focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit" disabled={isSubmitting} aria-busy={isSubmitting}
          className="flex-1 py-3 rounded-md text-sm font-bold bg-accent hover:opacity-90 active:scale-[0.98] text-accent-contrast transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
        >
          {t("Add Contribution")}
        </button>
        <button
          type="button" onClick={onClose}
          className="flex-1 py-3 rounded-md text-sm font-semibold bg-surface-sunken hover:bg-hairline active:scale-[0.98] text-ink transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
        >
          {t("Cancel")}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Postcard illustration — an abstract flat-color horizon-line scene built
// from the goal's own color plus tint/shade variants (via color-mix()),
// standing in for the WPA-poster "illustrated plane" without an image tool.
// The composition (hill count, sizing, horizon height, sun position, mirror)
// is derived deterministically from the goal's id, so any two goals render
// visibly distinct scenes even when sharing the same color, while the same
// goal always redraws identically. Decorative only — no text ever sits on it.
// ─────────────────────────────────────────────
function tintOf(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${100 - pct}%, white ${pct}%)`;
}
function shadeOf(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${100 - pct}%, black ${pct}%)`;
}

function GoalIllustration({ seed, color }: { seed: string; color: string }) {
  const rng = mulberry32(hashSeed(seed));
  const r = () => rng();

  const W = 400;
  const H = 96;
  const groundY = 56 + r() * 16; // 56–72
  const mirrored = r() > 0.5;
  const twoHills = r() > 0.35;

  const hill1 = {
    cx: 60 + r() * 90,
    rx: 90 + r() * 60,
    ry: 34 + r() * 22,
  };
  const hill2 = {
    cx: 230 + r() * 120,
    rx: 100 + r() * 70,
    ry: 40 + r() * 26,
  };
  const sun = {
    cx: 60 + r() * 300,
    cy: 14 + r() * 16,
    radius: 9 + r() * 9,
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="w-full h-full"
      style={{ transform: mirrored ? "scaleX(-1)" : undefined }}
      aria-hidden="true"
    >
      <rect x={0} y={0} width={W} height={H} fill={color} />
      <circle cx={sun.cx} cy={sun.cy} r={sun.radius} fill={tintOf(color, 45)} opacity={0.9} />
      <line x1={0} y1={groundY} x2={W} y2={groundY} stroke={shadeOf(color, 30)} strokeWidth={1.5} opacity={0.5} />
      <ellipse cx={hill1.cx} cy={groundY + hill1.ry * 0.3} rx={hill1.rx} ry={hill1.ry} fill={tintOf(color, 18)} />
      {twoHills && (
        <ellipse cx={hill2.cx} cy={groundY + hill2.ry * 0.35} rx={hill2.rx} ry={hill2.ry} fill={shadeOf(color, 16)} />
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Goal card — "postcard" treatment: an illustrated flat-color plane band in
// the goal's own color tops the card, with a coin-like neutral badge (echoing
// the logo's coin motif) straddling the band/body seam. All readable text and
// figures live in the body on the app's neutral surface, never directly on
// the saturated band, so contrast never depends on which of the eight goal
// colors a user picked.
// ─────────────────────────────────────────────
interface GoalCardProps {
  goal: SavingsGoal;
  onContribute: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  reduceMotion: boolean;
}

function GoalCard({ goal, onContribute, onDelete, onRefresh, reduceMotion }: GoalCardProps) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const [showHistory, setShowHistory] = useState(false);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [confirmContribId, setConfirmContribId] = useState<string | null>(null);
  const [contribError, setContribError] = useState("");

  useEffect(() => {
    if (!showHistory) return;
    let cancelled = false;
    async function load() {
      const data = (await getContributionsForGoal(goal.id))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      if (!cancelled) setContributions(data);
    }
    load();
    return () => { cancelled = true; };
  }, [showHistory, goal.id]);

  const now = useMemo(() => new Date(), []);

  const pct = Math.min(100, goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0);
  const remaining = goal.targetAmount - goal.currentAmount;
  const daysLeft = Math.ceil((goal.deadline.getTime() - now.getTime()) / 86400000);
  const isComplete = goal.currentAmount >= goal.targetAmount;
  const isOverdue = daysLeft < 0 && !isComplete;
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  const monthlyNeeded = remaining / monthsLeft;

  async function handleDeleteContribution(id: string) {
    try {
      await deleteGoalContribution(id);
      setConfirmContribId(null);
      const data = (await getContributionsForGoal(goal.id))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setContributions(data);
      onRefresh();
    } catch (err) {
      setConfirmContribId(null);
      setContribError(err instanceof Error ? err.message : t("An error occurred. Please try again."));
    }
  }

  return (
    <>
      <div className="bg-surface border border-hairline rounded-lg overflow-hidden transition-colors hover:border-ink-faint">
        {/* Postcard band — authored flat-color illustration, decorative only, no text on it */}
        <div className="h-20 shrink-0 overflow-hidden" aria-hidden="true">
          <GoalIllustration seed={goal.id || goal.name} color={goal.color} />
        </div>

        <div className="px-5 pb-5">
          {/* Coin badge + delete, straddling the band/body seam */}
          <div className="flex items-start justify-between -mt-6 mb-3">
            <div
              className="w-12 h-12 rounded-full bg-surface border border-hairline flex items-center justify-center shrink-0"
              style={{ boxShadow: "0 0 0 4px var(--surface)" }}
              aria-hidden="true"
            >
              <Target size={18} style={{ color: goal.color }} />
            </div>
            <button
              onClick={onDelete}
              aria-label={`${t("Delete goal")} ${goal.name}`}
              className="w-9 h-9 mt-2 flex items-center justify-center rounded-full bg-surface border border-hairline text-ink-muted hover:text-negative hover:bg-surface-sunken active:scale-95 transition-all cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-negative"
              style={{ boxShadow: "0 0 0 4px var(--surface)" }}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>

          {contribError && <ErrorBanner message={contribError} />}

          {/* Name + deadline — the completion badge sits right beside the name
              (not the deadline line) so "done and locked in" reads at a glance
              with the goal it belongs to; scaled up slightly from its base
              20px ring / 11px label since SealedBadge itself is shared and
              not restyled here. */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-ink truncate min-w-0">{goal.name}</h3>
              {isComplete && (
                <span className="inline-block scale-[1.15] origin-left shrink-0">
                  <SealedBadge label={t("Completed")} />
                </span>
              )}
            </div>
            <p className="text-xs text-ink-muted mt-0.5 flex items-center flex-wrap gap-x-1.5 gap-y-1">
              <span className="font-mono">
                {t("Deadline")}{": "}
                {goal.deadline.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
              </span>
              {isOverdue && <span className="text-negative font-medium">· {t("Overdue")}</span>}
            </p>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-semibold font-mono tabular-nums text-ink">{formatCurrency(goal.currentAmount)}</span>
              <span className="text-ink-muted font-mono tabular-nums">{t("of")} {formatCurrency(goal.targetAmount)}</span>
            </div>
            <div
              className="w-full bg-hairline rounded-full h-3 overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}
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
            <div className="flex justify-between text-xs text-ink-muted mt-1">
              <span>{pct.toFixed(1)}% {t("complete")}</span>
              <span className="font-mono tabular-nums">{formatCurrency(remaining)} {t("remaining")}</span>
            </div>
          </div>

          {/* Stats — only for active goals */}
          {!isComplete && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-surface-sunken border border-hairline rounded-md p-3 text-center">
                <p className="text-[11px] text-ink-muted mb-1">{t("Days left")}</p>
                <p className={`text-lg font-bold font-mono tabular-nums ${isOverdue ? "text-negative" : "text-ink"}`}>
                  {isOverdue ? t("Overdue") : daysLeft}
                </p>
              </div>
              <div className="bg-surface-sunken border border-hairline rounded-md p-3 text-center">
                <p className="text-[11px] text-ink-muted mb-1">{t("Needed/month")}</p>
                <p className="text-lg font-bold font-mono tabular-nums text-ink">{formatCurrency(monthlyNeeded)}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!isComplete && (
              <button
                onClick={onContribute}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-bold text-ink bg-surface hover:bg-surface-sunken active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
                style={{ border: `1.5px solid ${goal.color}` }}
                aria-label={`${t("Add Money to")} ${goal.name}`}
              >
                <PlusCircle size={14} style={{ color: goal.color }} aria-hidden="true" />
                {t("Add Money")}
              </button>
            )}
            <button
              onClick={() => setShowHistory((v) => !v)}
              aria-expanded={showHistory}
              aria-controls={`history-${goal.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-sm font-semibold bg-surface-sunken hover:bg-hairline active:scale-[0.98] text-ink-muted hover:text-ink transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <History size={14} aria-hidden="true" />
              {t("History")}
              {showHistory
                ? <ChevronUp size={12} aria-hidden="true" />
                : <ChevronDown size={12} aria-hidden="true" />
              }
            </button>
          </div>

          {/* Contribution history */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                id={`history-${goal.id}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" as const }}
                className="overflow-hidden"
              >
                <div className="mt-4 border-t border-hairline pt-4">
                  {contributions.length === 0 ? (
                    <p className="text-sm text-ink-muted text-center py-2">{t("No contributions yet.")}</p>
                  ) : (
                    <div className="space-y-2">
                      {contributions.map((c) => (
                        <div key={c.id} className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-semibold font-mono tabular-nums text-ink">
                              {formatCurrency(c.amount)}
                            </span>
                            {c.note && <span className="text-ink-muted text-xs ml-2">· {c.note}</span>}
                            <p className="text-xs text-ink-muted font-mono">
                              {c.createdAt.toLocaleDateString(locale, { day: "numeric" })}{" "}
                              {formatMonthKey(c.monthKey, locale)}
                            </p>
                          </div>
                          <button
                            onClick={() => setConfirmContribId(c.id)}
                            aria-label={`${t("Remove contribution")} ${formatCurrency(c.amount)}`}
                            className="w-9 h-9 flex items-center justify-center rounded-md text-ink-muted hover:text-negative hover:bg-negative/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-negative"
                          >
                            <Trash2 size={13} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirm contribution delete */}
      <AnimatePresence>
        {confirmContribId && (
          <ConfirmDialog
            message={t("This contribution will be permanently removed from this goal.")}
            onConfirm={() => handleDeleteContribution(confirmContribId)}
            onCancel={() => setConfirmContribId(null)}
            reduceMotion={reduceMotion}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function GoalsPage() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion() ?? false;

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [contributing, setContributing] = useState<SavingsGoal | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [confirmGoalId, setConfirmGoalId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = (await getSavingsGoals()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      if (!cancelled) {
        setGoals(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refresh]);

  async function handleDelete(id: string) {
    try {
      await deleteSavingsGoal(id);
      setConfirmGoalId(null);
      setRefresh((r) => r + 1);
    } catch (err) {
      setConfirmGoalId(null);
      setActionError(err instanceof Error ? err.message : t("An error occurred. Please try again."));
    }
  }

  const activeGoals    = goals.filter((g) => g.currentAmount < g.targetAmount);
  const completedGoals = goals.filter((g) => g.currentAmount >= g.targetAmount);
  const totalSaved     = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget    = goals.reduce((s, g) => s + g.targetAmount, 0);

  const cardProps = { onRefresh: () => setRefresh((r) => r + 1), reduceMotion };

  return (
    <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">{t("Savings Goals")}</h1>
          <p className="text-sm text-ink-muted mt-0.5">{t("Track your financial targets")}</p>
        </div>
        <button
          onClick={() => setShowNewGoal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold bg-accent hover:opacity-90 active:scale-[0.98] text-accent-contrast transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
        >
          <Plus size={16} aria-hidden="true" />
          {t("New Goal")}
        </button>
      </div>

      {actionError && <ErrorBanner message={actionError} />}

      {loading ? (
        <GoalsSkeleton />
      ) : (
        <>
          {/* Summary — one inline ledger strip, not a row of stat cards. Stacks
              with horizontal dividers on phones so currency values don't wrap/clip. */}
          {goals.length > 0 && (
            <div className="bg-surface border border-hairline rounded-lg divide-y divide-hairline sm:divide-y-0 sm:divide-x sm:flex mb-8">
              {[
                { label: t("Total Goals"), value: goals.length.toString(), sub: `${completedGoals.length} ${t(completedGoals.length === 1 ? "complete" : "completed")}`, mono: false },
                { label: t("Total Saved"), value: formatCurrency(totalSaved), sub: t("across all goals"), mono: true },
                { label: t("Total Target"), value: formatCurrency(totalTarget), sub: `${totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}% ${t("overall")}`, mono: true },
              ].map(({ label, value, sub, mono }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 sm:flex-1 sm:flex-col sm:items-start sm:justify-center sm:gap-1"
                >
                  <span className="text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase">{label}</span>
                  <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                    <span className={`text-lg font-bold tabular-nums text-ink ${mono ? "font-mono" : ""}`}>{value}</span>
                    <span className="text-xs text-ink-muted">{sub}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Active goals */}
          {activeGoals.length > 0 && (
            <section aria-labelledby="active-goals-heading" className="mb-8">
              <h2 id="active-goals-heading" className="text-xs font-mono font-bold text-accent tracking-widest uppercase mb-4">
                {t("Active Goals")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onContribute={() => setContributing(goal)}
                    onDelete={() => setConfirmGoalId(goal.id)}
                    {...cardProps}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed goals */}
          {completedGoals.length > 0 && (
            <section aria-labelledby="completed-goals-heading" className="mb-8">
              <h2 id="completed-goals-heading" className="text-xs font-mono font-bold text-ink-faint tracking-widest uppercase mb-4">
                {t("Completed Goals")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onContribute={() => setContributing(goal)}
                    onDelete={() => setConfirmGoalId(goal.id)}
                    {...cardProps}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {goals.length === 0 && (
            <div className="text-center py-20">
              <Target size={48} className="mx-auto mb-4 text-ink-faint" aria-hidden="true" />
              <p className="font-semibold text-lg text-ink-muted">{t("No savings goals yet")}</p>
              <p className="text-sm text-ink-muted mt-1 mb-6">
                {t("Create a goal to start tracking your savings progress")}
              </p>
              <button
                onClick={() => setShowNewGoal(true)}
                className="flex items-center gap-2 mx-auto px-4 py-2.5 rounded-md text-sm font-bold bg-accent hover:opacity-90 active:scale-[0.98] text-accent-contrast transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
              >
                <Plus size={16} aria-hidden="true" />
                {t("Create First Goal")}
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirm goal deletion */}
      <AnimatePresence>
        {confirmGoalId && (
          <ConfirmDialog
            message={t("This goal and all its contributions will be permanently deleted.")}
            onConfirm={() => handleDelete(confirmGoalId)}
            onCancel={() => setConfirmGoalId(null)}
            reduceMotion={reduceMotion}
          />
        )}
      </AnimatePresence>

      {/* New goal modal */}
      {showNewGoal && (
        <Modal title={t("Create Savings Goal")} onClose={() => setShowNewGoal(false)}>
          <NewGoalForm
            onSave={() => setRefresh((r) => r + 1)}
            onClose={() => setShowNewGoal(false)}
          />
        </Modal>
      )}

      {/* Contribute modal */}
      {contributing && (
        <Modal
          title={`${t("Add Money to")} "${contributing.name}"`}
          onClose={() => setContributing(null)}
        >
          <ContributeForm
            goal={contributing}
            onSave={() => setRefresh((r) => r + 1)}
            onClose={() => setContributing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
