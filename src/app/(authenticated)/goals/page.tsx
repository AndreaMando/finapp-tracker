"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Target, PlusCircle,
  ChevronDown, ChevronUp, History, AlertTriangle, CheckCircle2,
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
  formatDate,
  type SavingsGoal,
  type GoalContribution,
} from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/lib/i18n";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency", currency: "EUR", minimumFractionDigits: 2,
  }).format(amount);
}

// ─────────────────────────────────────────────
// P3: Skeleton
// ─────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-[#1a1d24] rounded-xl animate-pulse ${className}`} aria-hidden="true" />;
}

function GoalsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Caricamento obiettivi...">
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[#111318] border border-[#1a1d24] rounded-2xl p-5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-[#111318] border border-[#1a1d24] rounded-2xl overflow-hidden">
            <Skeleton className="h-1.5 w-full rounded-none" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Accessible confirm dialog
// ─────────────────────────────────────────────
interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  reduceMotion: boolean;
}

function ConfirmDialog({ message, onConfirm, onCancel, reduceMotion }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  // P1: focus trap — focus cancel button on open
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // P1: close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    // P1: role="dialog" with aria-modal
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      role="dialog" 
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={onCancel} 
        aria-hidden="true" 
      />
      <motion.div
        initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
        transition={{ duration: reduceMotion ? 0 : 0.15, ease: "easeOut" as const }}
        className="relative z-10 bg-[#1a1d24] border border-[#252830] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-400" aria-hidden="true" />
          </div>
          <div>
            <p id="confirm-title" className="text-sm font-semibold text-white">
              {t("Confirm Deletion")}
            </p>
            <p id="confirm-desc" className="text-xs text-[#9ca3af] mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* P8: destructive action is visually distinct and NOT the default focus */}
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            {t("Delete")}
          </button>
          {/* P1: cancel is default focus */}
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#252830] text-white hover:bg-[#2e3340] active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
          >
            {t("Cancel")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// New goal form
// ─────────────────────────────────────────────
interface NewGoalFormProps { onSave: () => void; onClose: () => void; }

function NewGoalForm({ onSave, onClose }: NewGoalFormProps) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
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
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#111318] -m-6 p-6 rounded-b-2xl" noValidate>

      {/* Goal Name */}
      <div className="space-y-1.5">
        <label htmlFor="goal-name" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
          {t("Goal Name")} <span className="text-[#00FFA3]" aria-hidden="true">*</span>
        </label>
        <input
          ref={nameRef} id="goal-name" type="text" value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
          placeholder={t("e.g. Emergency Fund, Vacation, New Laptop")}
          aria-required="true" aria-invalid={errors.name ? "true" : undefined}
          aria-describedby={errors.name ? "goal-name-error" : undefined}
          autoFocus
          className="block w-full px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl 
                     placeholder-[#6b7280] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3]"
        />
        {errors.name && <p id="goal-name-error" role="alert" className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
      </div>

      {/* Target Amount */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="goal-target" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
            {t("Target Amount")} (€) <span className="text-[#00FFA3]" aria-hidden="true">*</span>
          </label>
          <input
            ref={targetRef} id="goal-target" type="number" step="0.01" min="0" value={target}
            onChange={(e) => { setTarget(e.target.value); setErrors((p) => ({ ...p, target: "" })); }}
            placeholder="1000.00"
            aria-required="true" aria-invalid={errors.target ? "true" : undefined}
            aria-describedby={errors.target ? "goal-target-error" : undefined}
            className="block w-full px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl 
                       placeholder-[#6b7280] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] 
                       [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {errors.target && <p id="goal-target-error" role="alert" className="text-[11px] text-red-400 mt-1">{errors.target}</p>}
        </div>

        {/* Deadline */}
        <div className="space-y-1.5">
          <label htmlFor="goal-deadline" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
            {t("Deadline")} <span className="text-[#00FFA3]" aria-hidden="true">*</span>
          </label>
          <input
            id="goal-deadline"
            type="date"
            value={deadline}
            onChange={(e) => { setDeadline(e.target.value); setErrors((p) => ({ ...p, deadline: "" })); }}
            aria-required="true" aria-invalid={errors.deadline ? "true" : undefined}
            className="block w-full min-w-0 px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl 
                       transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] cursor-pointer 
                       [&::-webkit-calendar-picker-indicator]:invert [appearance:none] [&::-webkit-date-and-time-value]:text-left [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0"
          />
          {errors.deadline && <p role="alert" className="text-[11px] text-red-400 mt-1">{errors.deadline}</p>}
        </div>
      </div>

      {/* Color picker */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">{t("Color")}</p>
        <div className="flex gap-2.5 flex-wrap" role="group" aria-label={t("Choose goal color")}>
          {GOAL_COLORS.map((c) => (
            <button
              key={c} type="button" onClick={() => setColor(c)}
              aria-label={`Colore ${c}`}
              aria-pressed={color === c}
              className="w-7 h-7 rounded-full transition-transform cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d24]"
              style={{
                backgroundColor: c,
                transform: color === c ? "scale(1.25)" : "scale(1)",
                boxShadow: color === c ? `0 0 0 2px #1a1d24, 0 0 0 4px ${c}` : "none",
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit" disabled={isSubmitting} aria-busy={isSubmitting}
          className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#00FFA3] hover:bg-[#00ffb3] active:scale-[0.98] text-[#0d0d0d] 
                     transition-all cursor-pointer disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#1a1d24]"
        >
          {t("Create Goal")}
        </button>
        <button
          type="button" onClick={onClose}
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#252830] hover:bg-[#2e3340] active:scale-[0.98] text-white 
                     transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9ca3af] focus:ring-offset-2 focus:ring-offset-[#1a1d24]"
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
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#111318] -m-6 p-6 rounded-b-2xl" noValidate>

      {/* Goal preview */}
      <div className="bg-[#0d0d0d] border border-[#252830] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: goal.color }} aria-hidden="true" />
          <span className="font-semibold text-white text-sm">{goal.name}</span>
        </div>
        <div className="flex justify-between text-xs text-[#9ca3af] mb-2">
          <span>{t("Saved:")} <span className="text-[#e5e7eb] font-medium tabular-nums">{formatCurrency(goal.currentAmount)}</span></span>
          <span>{t("Remaining:")} <span className="text-[#e5e7eb] font-medium tabular-nums">{formatCurrency(remaining)}</span></span>
        </div>
        <div
          className="w-full bg-[#1a1d24] rounded-full h-1.5 overflow-hidden"
          role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}
        >
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label htmlFor="contrib-amount" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
          {t("Amount to Add")} (€) <span className="text-[#00FFA3]" aria-hidden="true">*</span>
        </label>
        <input
          ref={amountRef} id="contrib-amount" type="number" step="0.01" min="0" max={remaining}
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          placeholder={`${t("Max")} ${formatCurrency(remaining)}`}
          aria-required="true" aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "contrib-amount-error" : undefined}
          autoFocus
          className="block w-full h-[46px] px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl placeholder-[#6b7280] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3]"
        />
        {error && <p id="contrib-amount-error" role="alert" className="text-[11px] text-red-400 mt-1">{error}</p>}
      </div>

      {/* Month (read-only) */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">{t("Month")}</p>
        <p className="text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl px-4 py-3 h-[46px] flex items-center">
          {formatMonthKey(monthKey, locale)}
        </p>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label htmlFor="contrib-note" className="block text-[11px] font-semibold text-[#9ca3af] tracking-widest uppercase">
          {t("Note (optional)")}
        </label>
        <input
          id="contrib-note" type="text" value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("e.g. Monthly savings transfer")}
          className="block w-full h-[46px] px-4 py-3 text-sm text-white bg-[#0d0d0d] border border-[#252830] rounded-xl placeholder-[#6b7280] transition-all focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3]"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit" disabled={isSubmitting} aria-busy={isSubmitting}
          className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-[0.98] text-[#0d0d0d] transition-all cursor-pointer disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1d24]"
          style={{ backgroundColor: goal.color }}
        >
          {t("Add Contribution")}
        </button>
        <button
          type="button" onClick={onClose}
          className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#252830] hover:bg-[#2e3340] active:scale-[0.98] text-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9ca3af] focus:ring-offset-2 focus:ring-offset-[#1a1d24]"
        >
          {t("Cancel")}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Goal card
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
  // P8: accessible confirm for contribution deletion
  const [confirmContribId, setConfirmContribId] = useState<string | null>(null);

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

  // P1: useMemo so Date.now() is not called during render
  const now = useMemo(() => new Date(), []);

  const pct = Math.min(100, goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0);
  const remaining = goal.targetAmount - goal.currentAmount;
  const daysLeft = Math.ceil((goal.deadline.getTime() - now.getTime()) / 86400000);
  const isComplete = goal.currentAmount >= goal.targetAmount;
  const isOverdue = daysLeft < 0 && !isComplete;
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  const monthlyNeeded = remaining / monthsLeft;

  async function handleDeleteContribution(id: string) {
    await deleteGoalContribution(id);
    setConfirmContribId(null);
    const data = (await getContributionsForGoal(goal.id))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setContributions(data);
    onRefresh();
  }

  return (
    <>
      <div className="bg-[#111318] border border-[#1a1d24] rounded-2xl overflow-hidden">
        {/* Color bar */}
        <div className="h-1.5 w-full" style={{ backgroundColor: goal.color }} aria-hidden="true" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: goal.color }} aria-hidden="true" />
              <div className="min-w-0">
                <h3 className="font-semibold text-white truncate">{goal.name}</h3>
                <p className="text-xs text-[#6b7280] mt-0.5">
                  {t("Deadline")}{": "}
                  {goal.deadline.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                  {isOverdue && <span className="ml-1 text-red-400 font-medium">· {t("Overdue")}</span>}
                  {isComplete && <span className="ml-1 text-[#00FFA3] font-medium">· {t("Completed")}</span>}
                </p>
              </div>
            </div>
            {/* P2: 36×36 touch target */}
            <button
              onClick={onDelete}
              aria-label={`${t("Delete goal")} ${goal.name}`}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-semibold text-[#e5e7eb] tabular-nums">{formatCurrency(goal.currentAmount)}</span>
              <span className="text-[#6b7280] tabular-nums">{t("of")} {formatCurrency(goal.targetAmount)}</span>
            </div>
            <div
              className="w-full bg-[#1a1d24] rounded-full h-3 overflow-hidden"
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
            <div className="flex justify-between text-xs text-[#6b7280] mt-1">
              <span>{pct.toFixed(1)}% {t("complete")}</span>
              <span className="tabular-nums">{formatCurrency(remaining)} {t("remaining")}</span>
            </div>
          </div>

          {/* Stats — only for active goals */}
          {!isComplete && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#0d0d0d] border border-[#1a1d24] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#6b7280] mb-1">{t("Days left")}</p>
                <p className={`text-lg font-bold tabular-nums ${isOverdue ? "text-red-400" : "text-white"}`}>
                  {isOverdue ? t("Overdue") : daysLeft}
                </p>
              </div>
              <div className="bg-[#0d0d0d] border border-[#1a1d24] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#6b7280] mb-1">{t("Needed/month")}</p>
                <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(monthlyNeeded)}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!isComplete && (
              <button
                onClick={onContribute}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111318]"
                style={{ backgroundColor: goal.color, color: "#0d0d0d" }}
                aria-label={`${t("Add Money to")} ${goal.name}`}
              >
                <PlusCircle size={14} aria-hidden="true" />
                {t("Add Money")}
              </button>
            )}
            <button
              onClick={() => setShowHistory((v) => !v)}
              aria-expanded={showHistory}
              aria-controls={`history-${goal.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-[#1a1d24] hover:bg-[#252830] active:scale-[0.98] text-[#9ca3af] hover:text-white transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
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
                <div className="mt-4 border-t border-[#1a1d24] pt-4">
                  {contributions.length === 0 ? (
                    <p className="text-sm text-[#6b7280] text-center py-2">{t("No contributions yet.")}</p>
                  ) : (
                    <div className="space-y-2">
                      {contributions.map((c) => (
                        <div key={c.id} className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-semibold text-[#e5e7eb] tabular-nums">
                              {formatCurrency(c.amount)}
                            </span>
                            {c.note && <span className="text-[#6b7280] text-xs ml-2">· {c.note}</span>}
                            <p className="text-xs text-[#6b7280]">
                              {c.createdAt.toLocaleDateString(locale, { day: "numeric" })}{" "}
                              {formatMonthKey(c.monthKey, locale)}
                            </p>
                          </div>
                          {/* P2: 36×36 touch target */}
                          <button
                            onClick={() => setConfirmContribId(c.id)}
                            aria-label={`${t("Remove contribution")} ${formatCurrency(c.amount)}`}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
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

  // P3: cancel flag
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
    await deleteSavingsGoal(id);
    setConfirmGoalId(null);
    setRefresh((r) => r + 1);
  }

  const activeGoals    = goals.filter((g) => g.currentAmount < g.targetAmount);
  const completedGoals = goals.filter((g) => g.currentAmount >= g.targetAmount);
  const totalSaved     = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget    = goals.reduce((s, g) => s + g.targetAmount, 0);

  const cardProps = { onRefresh: () => setRefresh((r) => r + 1), reduceMotion };

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-5xl w-full mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t("Savings Goals")}</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">{t("Track your financial targets")}</p>
        </div>
        <button
          onClick={() => setShowNewGoal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#00FFA3] hover:bg-[#00ffb3] active:scale-[0.98] text-[#0d0d0d] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
        >
          <Plus size={16} aria-hidden="true" />
          {t("New Goal")}
        </button>
      </div>

      {/* P3: skeleton */}
      {loading ? (
        <GoalsSkeleton />
      ) : (
        <>
          {/* Summary */}
          {goals.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: t("Total Goals"), value: goals.length.toString(), sub: `${completedGoals.length} ${t(completedGoals.length === 1 ? "complete" : "completed")}`, color: "text-white" },
                { label: t("Total Saved"), value: formatCurrency(totalSaved), sub: t("across all goals"), color: "text-indigo-400" },
                { label: t("Total Target"), value: formatCurrency(totalTarget), sub: `${totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}% ${t("overall")}`, color: "text-white" },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="bg-[#111318] border border-[#1a1d24] rounded-2xl p-5">
                  <p className="text-sm text-[#9ca3af]">{label}</p>
                  <p className={`text-2xl font-bold tabular-nums tracking-tight mt-1 ${color}`}>{value}</p>
                  <p className="text-xs text-[#4b5563] mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Active goals */}
          {activeGoals.length > 0 && (
            <section aria-labelledby="active-goals-heading" className="mb-8">
              <h2 id="active-goals-heading" className="text-xs font-bold text-[#00FFA3] tracking-widest uppercase mb-4">
                {t("Active Goals")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <h2 id="completed-goals-heading" className="text-xs font-bold text-[#6b7280] tracking-widest uppercase mb-4">
                {t("Completed Goals")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Target size={48} className="mx-auto mb-4 text-[#252830]" aria-hidden="true" />
              <p className="font-semibold text-lg text-[#9ca3af]">{t("No savings goals yet")}</p>
              <p className="text-sm text-[#6b7280] mt-1 mb-6">
                {t("Create a goal to start tracking your savings progress")}
              </p>
              <button
                onClick={() => setShowNewGoal(true)}
                className="flex items-center gap-2 mx-auto px-4 py-2.5 rounded-xl text-sm font-bold bg-[#00FFA3] hover:bg-[#00ffb3] active:scale-[0.98] text-[#0d0d0d] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#0d0d0d]"
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