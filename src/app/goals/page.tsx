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
  type SavingsGoal,
  type GoalContribution,
} from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

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
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required.";
    const parsed = parseFloat(target);
    if (isNaN(parsed) || parsed <= 0) e.target = "Enter a valid target amount.";
    if (!deadline) e.deadline = "Deadline is required.";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    addSavingsGoal(name.trim(), parseFloat(target), deadline, color);
    onSave();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Goal Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
          placeholder="e.g. Emergency Fund, Vacation, New Laptop"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Amount (€) <span className="text-red-500">*</span>
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
            Deadline <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => { setDeadline(e.target.value); setErrors((p) => ({ ...p, deadline: "" })); }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div className="flex gap-2 flex-wrap">
          {GOAL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Create Goal</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
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
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [monthKey] = useState(currentMonthKey());
  const [error, setError] = useState("");

  const remaining = goal.targetAmount - goal.currentAmount;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (parsed > remaining) {
      setError(`Max contribution is ${formatCurrency(remaining)}.`);
      return;
    }
    addGoalContribution(goal.id, monthKey, parsed, note);
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
          <span>Saved: {formatCurrency(goal.currentAmount)}</span>
          <span>Remaining: {formatCurrency(remaining)}</span>
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
          Amount to Add (€) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max={remaining}
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          placeholder={`Max: ${formatCurrency(remaining)}`}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Month
        </label>
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          {formatMonthKey(monthKey)}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Note (optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Monthly savings transfer"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">Add Contribution</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
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
  const [showHistory, setShowHistory] = useState(false);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);

  useEffect(() => {
    if (showHistory) {
      const data = getContributionsForGoal(goal.id);
      data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      Promise.resolve().then(() => setContributions(data));
    }
  }, [showHistory, goal.id]);

  const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  const remaining = goal.targetAmount - goal.currentAmount;
  const deadline = new Date(goal.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isComplete = goal.currentAmount >= goal.targetAmount;
  const isOverdue = daysLeft < 0 && !isComplete;

  // Monthly needed to reach goal
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  const monthlyNeeded = remaining / monthsLeft;

  function handleDeleteContribution(id: string) {
    if (confirm("Remove this contribution?")) {
      deleteGoalContribution(id);
      const data = getContributionsForGoal(goal.id);
      data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
                Deadline:{" "}
                {deadline.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {isOverdue && (
                  <span className="ml-1 text-red-500 font-medium">· Overdue</span>
                )}
                {isComplete && (
                  <span className="ml-1 text-emerald-500 font-medium">· Completed! 🎉</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
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
            <span className="text-gray-400">of {formatCurrency(goal.targetAmount)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: goal.color }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{pct.toFixed(1)}% complete</span>
            <span>{formatCurrency(remaining)} remaining</span>
          </div>
        </div>

        {/* Stats */}
        {!isComplete && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">Days left</p>
              <p className={`text-lg font-bold ${isOverdue ? "text-red-500" : "text-gray-700"}`}>
                {isOverdue ? "Overdue" : daysLeft}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">Needed/month</p>
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
              className="flex-1"
              onClick={onContribute}
              style={{ backgroundColor: goal.color, borderColor: goal.color }}
            >
              <PlusCircle size={14} />
              Add Money
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowHistory((v) => !v)}
            className="flex-1"
          >
            <History size={14} />
            History
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </Button>
        </div>

        {/* Contribution History */}
        {showHistory && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            {contributions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">No contributions yet.</p>
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
                        {formatMonthKey(c.monthKey)} ·{" "}
                        {new Date(c.createdAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteContribution(c.id)}
                      className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors"
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
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [contributing, setContributing] = useState<SavingsGoal | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const data = getSavingsGoals().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    Promise.resolve().then(() => setGoals(data));
  }, [refresh]);

  function handleDelete(id: string) {
    if (confirm("Delete this goal and all its contributions?")) {
      deleteSavingsGoal(id);
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
          <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track your financial targets</p>
        </div>
        <Button onClick={() => setShowNewGoal(true)}>
          <Plus size={16} />
          New Goal
        </Button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Goals</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{goals.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">{completedGoals.length} completed</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Saved</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(totalSaved)}</p>
            <p className="text-xs text-gray-400 mt-0.5">across all goals</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Target</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalTarget)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}% overall
            </p>
          </div>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">
            Active Goals
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
      {completedGoals.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-400 text-sm uppercase tracking-wide mb-4">
            Completed 🎉
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
          <p className="font-semibold text-lg">No savings goals yet</p>
          <p className="text-sm mt-1 mb-6">
            Create a goal to start tracking your savings progress
          </p>
          <Button onClick={() => setShowNewGoal(true)}>
            <Plus size={16} />
            Create First Goal
          </Button>
        </div>
      )}

      {/* Modals */}
      {showNewGoal && (
        <Modal title="Create Savings Goal" onClose={() => setShowNewGoal(false)}>
          <NewGoalForm
            onSave={() => setRefresh((r) => r + 1)}
            onClose={() => setShowNewGoal(false)}
          />
        </Modal>
      )}

      {contributing && (
        <Modal
          title={`Add Money to "${contributing.name}"`}
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
