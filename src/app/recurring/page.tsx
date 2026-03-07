"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import {
  getRecurringExpenses,
  addRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  type RecurringExpense,
} from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const CATEGORIES = [
  "Housing",
  "Utilities",
  "Insurance",
  "Subscriptions",
  "Transport",
  "Health",
  "Education",
  "Other",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface ExpenseFormProps {
  existing?: RecurringExpense;
  onSave: () => void;
  onClose: () => void;
}

function ExpenseForm({ existing, onSave, onClose }: ExpenseFormProps) {
  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(existing?.amount.toString() ?? "");
  const [category, setCategory] = useState(existing?.category ?? CATEGORIES[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required.";
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) e.amount = "Enter a valid amount.";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (existing) {
      updateRecurringExpense(existing.id, {
        name: name.trim(),
        amount: parseFloat(amount),
        category,
      });
    } else {
      addRecurringExpense(name.trim(), parseFloat(amount), category);
    }
    onSave();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
          placeholder="e.g. Netflix, Rent, Car Insurance"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monthly Amount (€) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setErrors((prev) => ({ ...prev, amount: "" })); }}
          placeholder="e.g. 12.99"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {existing ? "Update" : "Add Expense"}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Housing: "bg-blue-100 text-blue-700",
  Utilities: "bg-yellow-100 text-yellow-700",
  Insurance: "bg-purple-100 text-purple-700",
  Subscriptions: "bg-pink-100 text-pink-700",
  Transport: "bg-orange-100 text-orange-700",
  Health: "bg-green-100 text-green-700",
  Education: "bg-indigo-100 text-indigo-700",
  Other: "bg-gray-100 text-gray-600",
};

export default function RecurringPage() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | undefined>();
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const data = getRecurringExpenses().sort((a, b) => a.name.localeCompare(b.name));
    Promise.resolve().then(() => setExpenses(data));
  }, [refresh]);

  function handleDelete(id: string) {
    if (confirm("Delete this recurring expense?")) {
      deleteRecurringExpense(id);
      setRefresh((r) => r + 1);
    }
  }

  function handleToggle(expense: RecurringExpense) {
    updateRecurringExpense(expense.id, { active: !expense.active });
    setRefresh((r) => r + 1);
  }

  function openEdit(expense: RecurringExpense) {
    setEditing(expense);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(undefined);
  }

  const activeExpenses = expenses.filter((e) => e.active);
  const inactiveExpenses = expenses.filter((e) => !e.active);
  const totalActive = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recurring Expenses</h1>
          <p className="text-gray-500 text-sm mt-0.5">Bills, subscriptions, and fixed costs</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setShowModal(true); }}>
          <Plus size={16} />
          Add Expense
        </Button>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
          <RefreshCw size={22} className="text-orange-500" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Total monthly recurring</p>
          <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalActive)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {activeExpenses.length} active expense{activeExpenses.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Active Expenses */}
      {activeExpenses.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
            Active
          </h2>
          <div className="space-y-2">
            {activeExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white rounded-xl px-5 py-3.5 shadow-sm border border-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(expense)}
                    className="text-emerald-500 hover:text-emerald-600 transition-colors"
                    title="Disable"
                  >
                    <ToggleRight size={22} />
                  </button>
                  <div>
                    <p className="font-medium text-gray-800">{expense.name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS.Other}`}
                    >
                      {expense.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(expense.amount)}
                    <span className="text-xs text-gray-400 font-normal">/mo</span>
                  </span>
                  <button
                    onClick={() => openEdit(expense)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive Expenses */}
      {inactiveExpenses.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-400 text-sm uppercase tracking-wide mb-3">
            Paused
          </h2>
          <div className="space-y-2">
            {inactiveExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-gray-50 rounded-xl px-5 py-3.5 border border-gray-100 flex items-center justify-between opacity-60"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(expense)}
                    className="text-gray-400 hover:text-emerald-500 transition-colors"
                    title="Enable"
                  >
                    <ToggleLeft size={22} />
                  </button>
                  <div>
                    <p className="font-medium text-gray-600 line-through">{expense.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                      {expense.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-400">
                    {formatCurrency(expense.amount)}
                    <span className="text-xs font-normal">/mo</span>
                  </span>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No recurring expenses yet</p>
          <p className="text-sm mt-1">Add your bills, subscriptions, and fixed costs</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          title={editing ? "Edit Recurring Expense" : "Add Recurring Expense"}
          onClose={closeModal}
        >
          <ExpenseForm
            existing={editing}
            onSave={() => setRefresh((r) => r + 1)}
            onClose={closeModal}
          />
        </Modal>
      )}
    </div>
  );
}
