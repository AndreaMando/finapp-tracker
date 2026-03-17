"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Target, PlusCircle, ChevronDown, ChevronUp, History } from "lucide-react";
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
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/lib/i18n";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─── New Goal Form ─────────────────────────────────────────────────────────────

interface NewGoalFormProps {
  onSave: () => void;
  onClose: () => void;
}

function NewGoalForm({ onSave, onClose }: NewGoalFormProps) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const now = new Date();

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
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }    
    await addSavingsGoal(name.trim(), parseFloat(target), new Date(deadline), color);
    onSave();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("Goal Name")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
          placeholder={t("e.g. Emergency Fund, Vacation, New Laptop")}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Target Amount")} (€) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={target}
            onChange={(e) => { setTarget(e.target.value); setErrors((p) => ({ ...p, target: "" })); }}
            placeholder="1000.00"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {errors.target && <p className="text-red-500 text-xs mt-1">{errors.target}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Deadline")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={deadline}
              onChange={(e) => { setDeadline(e.target.value); setErrors((p) => ({ ...p, deadline: "" })); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 capitalize hidden sm:block cursor-pointer"
            />
            <label className="relative block sm:hidden">
              <input
                type="date"
                value={deadline}
                onChange={(e) => { setDeadline(e.target.value); setErrors((p) => ({ ...p, deadline: "" })); }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 opacity-0 absolute inset-0 cursor-pointer z-10"
              />
              <span className="absolute inset-0 flex items-center px-3 py-2.5 text-sm border border-gray-200 rounded-xl pointer-events-none capitalize z-0">
                {deadline ? formatDate(deadline, locale) : "\u00A0"}
              </span>
            </label>
          </div>
          {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t("Color")}</label>
        <div className="flex gap-2 flex-wrap">
          {GOAL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 cursor-pointer">{t("Create Goal")}</Button>
        <Button type="button" variant="secondary" className="cursor-pointer" onClick={onClose}>{t("Cancel")}</Button>
      </div>
    </form>
  );
}

// ─── Contribute Form ───────────────────────────────────────────────────────────

interface ContributeFormProps {
  goal: SavingsGoal;
  onSave: () => void;
  onClose: () => void;
}

function ContributeForm({ goal, onSave, onClose }: ContributeFormProps) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [monthKey] = useState(currentMonthKey());
  const [error, setError] = useState("");

  const remaining = goal.targetAmount - goal.currentAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError(t("Enter a valid amount."));
      return;
    }
    if (parsed > remaining) {
      setError(t("Max contribution is") + ` ${formatCurrency(remaining)}.`);
      return;
    }
    // call the network API and wait for it to complete before closing
    await addGoalContribution(goal.id, monthKey, parsed, note);
    onSave();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: goal.color }} />
          <span className="font-semibold text-gray-800">{goal.name}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>{t("Saved:")} {formatCurrency(goal.currentAmount)}</span>
          <span>{t("Remaining:")} {formatCurrency(remaining)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
          <div
            className="h-1.5 rounded-full"
            style={{
              width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%`,
              backgroundColor: goal.color,
            }}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("Amount to Add")} (€) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max={remaining}
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          placeholder={t("Max contribution is") + ` ${formatCurrency(remaining)}`}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("Month")}
        </label>
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          {formatMonthKey(monthKey, locale)}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("Note (optional)")}
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("e.g. Monthly savings transfer")}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 cursor-pointer">{t("Add Contribution")}</Button>
        <Button type="button" variant="secondary" className="cursor-pointer" onClick={onClose}>{t("Cancel")}</Button>
      </div>
    </form>
  );
}

// ─── Goal Card ─────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: SavingsGoal;
  onContribute: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

function GoalCard({ goal, onContribute, onDelete, onRefresh }: GoalCardProps) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const [showHistory, setShowHistory] = useState(false);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);

  useEffect(() => {
    async function load() {
      let data = await getContributionsForGoal(goal.id);
      data = data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setContributions(data);
    }
    if (showHistory) {
      load();
    }
  }, [showHistory, goal.id]);

  const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  const remaining = goal.targetAmount - goal.currentAmount;
  const deadline = goal.deadline;
  const now = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isComplete = goal.currentAmount >= goal.targetAmount;
  const isOverdue = daysLeft < 0 && !isComplete;

  // Monthly needed to reach goal
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  const monthlyNeeded = remaining / monthsLeft;

  async function handleDeleteContribution(id: string) {
    if (confirm(t("Remove this contribution?"))) {
      await deleteGoalContribution(id);
      let data = (await getContributionsForGoal(goal.id));
      data = data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setContributions(data);
      onRefresh();
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Top color bar */}
      <div className="h-1.5" style={{ backgroundColor: goal.color }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full mt-0.5" style={{ backgroundColor: goal.color }} />
            <div>
              <h3 className="font-semibold text-gray-800">{goal.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {t("Deadline")}{": "}
                {deadline.toLocaleDateString(locale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {isOverdue && (
                  <span className="ml-1 text-red-500 font-medium">· {t("Overdue")}</span>
                )}
                {isComplete && (
                  <span className="ml-1 text-emerald-500 font-medium">· {t("Completed")}</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-semibold text-gray-800">
              {formatCurrency(goal.currentAmount)}
            </span>
            <span className="text-gray-400">{t("of")} {formatCurrency(goal.targetAmount)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: goal.color }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{pct.toFixed(1)}% {t("complete")}</span>
            <span>{formatCurrency(remaining)} {t("remaining")}</span>
          </div>
        </div>

        {/* Stats */}
        {!isComplete && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">{t("Days left")}</p>
              <p className={`text-lg font-bold ${isOverdue ? "text-red-500" : "text-gray-700"}`}>
                {isOverdue ? t("Overdue") : daysLeft}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">{t("Needed/month")}</p>
              <p className="text-lg font-bold text-gray-700">
                {formatCurrency(monthlyNeeded)}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!isComplete && (
            <Button
              size="sm"
              className="flex-1 justify-center cursor-pointer"
              onClick={onContribute}
              style={{ backgroundColor: goal.color, borderColor: goal.color }}
            >
              <PlusCircle size={14} />
              {t("Add Money")}
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowHistory((v) => !v)}
            className="flex-1 justify-center cursor-pointer"
          >
            <History size={14} />
            {t("History")}
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </Button>
        </div>

        {/* Contribution History */}
        {showHistory && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            {contributions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">{t("No contributions yet.")}</p>
            ) : (
              <div className="space-y-2">
                {contributions.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-medium text-gray-700">
                        {formatCurrency(c.amount)}
                      </span>
                      {c.note && (
                        <span className="text-gray-400 ml-2">· {c.note}</span>
                      )}
                      <p className="text-xs text-gray-400">
                        {c.createdAt.toLocaleDateString(locale, {
                          day: "numeric",
                        })}{" "}
                        {formatMonthKey(c.monthKey, locale)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteContribution(c.id)}
                      className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const { t } = useTranslation();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [contributing, setContributing] = useState<SavingsGoal | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    async function load() {
      const data = (await getSavingsGoals()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      setGoals(data);
    }
    load();
  }, [refresh]);

  async function handleDelete(id: string) {
    if (confirm("Delete this goal and all its contributions?")) {
      await deleteSavingsGoal(id);
      setRefresh((r) => r + 1);
    }
  }

  const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount);
  const completedGoals = goals.filter((g) => g.currentAmount >= g.targetAmount);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("Savings Goals")}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t("Track your financial targets")}</p>
        </div>
        <Button className="cursor-pointer" onClick={() => setShowNewGoal(true)}>
          <Plus size={16} />
          {t("New Goal")}
        </Button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{t("Total Goals")}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{goals.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {completedGoals.length} {t(completedGoals.length === 1 ? "complete" : "completed")}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{t("Total Saved")}</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(totalSaved)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t("across all goals")}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{t("Total Target")}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalTarget)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}% {t("overall")}
            </p>
          </div>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">
            {t("Active Goals")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onContribute={() => setContributing(goal)}
                onDelete={() => handleDelete(goal.id)}
                onRefresh={() => setRefresh((r) => r + 1)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">{t("Completed Goals")}</h2>
      {completedGoals.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-400 text-sm uppercase tracking-wide mb-4">
            {t("Completed")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onContribute={() => setContributing(goal)}
                onDelete={() => handleDelete(goal.id)}
                onRefresh={() => setRefresh((r) => r + 1)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Target size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-lg">{t("No savings goals yet")}</p>
          <p className="text-sm mt-1 mb-6">
            {t("Create a goal to start tracking your savings progress")}
          </p>
          <Button className="cursor-pointer" onClick={() => setShowNewGoal(true)}>
            <Plus size={16} />
            {t("Create First Goal")}
          </Button>
        </div>
      )}

      {/* Modals */}
      {showNewGoal && (
        <Modal title={t("Create Savings Goal")} onClose={() => setShowNewGoal(false)}>
          <NewGoalForm
            onSave={() => setRefresh((r) => r + 1)}
            onClose={() => setShowNewGoal(false)}
          />
        </Modal>
      )}

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
