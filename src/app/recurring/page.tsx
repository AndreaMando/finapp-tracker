"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import {
  getRecurringExpenses,
  addRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  currentMonthKey,
  formatMonthKey,
  type RecurringExpense,
} from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/lib/i18n";

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
  const { t, lang } = useTranslation();
  const todayKey = currentMonthKey();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(existing?.amount.toString() ?? "");
  const [category, setCategory] = useState(existing?.category ?? CATEGORIES[0]);
  const [startMonth, setStartMonth] = useState(existing?.startMonth ?? todayKey);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t("Name is required.");
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) e.amount = t("Enter a valid amount.");
    if (!startMonth) e.startMonth = t("Start month is required.");
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (existing) {
      await updateRecurringExpense(existing.id, {
        name: name.trim(),
        amount: parseFloat(amount),
        category,
        startMonth,
      });
    } else {
      await addRecurringExpense(name.trim(), parseFloat(amount), category, startMonth);
    }
    onSave();
    onClose();
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("Name")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
          placeholder={t("e.g. Netflix, Rent, Car Insurance")}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("Monthly Amount (€)")} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setErrors((prev) => ({ ...prev, amount: "" })); }}
          placeholder={t("e.g. 12.99")}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t("Category")}</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(c)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("Start Month")} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="month"
            value={startMonth}
            onChange={(e) => { setStartMonth(e.target.value); setErrors((prev) => ({ ...prev, startMonth: "" })); }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 opacity-0 absolute inset-0 cursor-pointer"
          />
          <span className="block w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm pointer-events-none capitalize">
            {startMonth ? formatMonthKey(startMonth, locale) : "\u00A0"}
          </span>
        </div>
        {errors.startMonth && <p className="text-red-500 text-xs mt-1">{errors.startMonth}</p>}
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {existing ? t("Update") : t("Add Expense")}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          {t("Cancel")}
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
  Education: "bg-green-100 text-indigo-700",
  Other: "bg-gray-100 text-gray-600",
};

export default function RecurringPage() {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | undefined>();
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    async function load() {
      const data = await getRecurringExpenses();
      data.sort((a, b) => a.name.localeCompare(b.name));
      setExpenses(data);
    }
    load();
  }, [refresh]);

  async function handleDelete(id: string) {
    if (confirm(t("Delete this recurring expense?"))) {
      await deleteRecurringExpense(id);
      setRefresh((r) => r + 1);
    }
  }

  async function handleToggle(expense: RecurringExpense) {
    await updateRecurringExpense(expense.id, { active: !expense.active });
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

  const currentKey = currentMonthKey();
  const activeExpenses = expenses.filter((e) => e.active && e.startMonth <= currentKey);
  const pausedExpenses = expenses.filter((e) => !e.active && e.startMonth <= currentKey);
  const upcomingExpenses = expenses.filter((e) => e.startMonth > currentKey);
  const totalActive = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("Recurring Expenses")}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t("Bills, subscriptions, and fixed costs")}</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setShowModal(true); }}>
          <Plus size={16} />
          {editing ? t("Update") : t("Add Expense")}
        </Button>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
          <RefreshCw size={22} className="text-orange-500" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{t("Total monthly recurring")}</p>
          <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalActive)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {activeExpenses.length} {t(activeExpenses.length === 1 ? "active expense" : "active expenses")}
          </p>
        </div>
      </div>

      {/* Active Expenses */}
      {activeExpenses.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
            {t("Active")}
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
                      {t(expense.category)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(expense.amount)}
                    <span className="text-xs text-gray-400 font-normal">{t("/mo")}</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    {t("Started:")} {formatMonthKey(expense.startMonth, locale)}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEdit(expense)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-green-50 transition-colors"
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paused Expenses */}
      {pausedExpenses.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-400 text-sm uppercase tracking-wide mb-3">
            {t("Paused")}
          </h2>
          <div className="space-y-2">
            {pausedExpenses.map((expense) => (
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
                    <p className="font-medium text-gray-600 line-through">
                      {expense.name}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                      {t(expense.category)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold text-gray-400">
                    {formatCurrency(expense.amount)}
                    <span className="text-xs font-normal">/mo</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    {t("Started:")} {formatMonthKey(expense.startMonth, locale)}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEdit(expense)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-green-50 transition-colors"
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Expenses */}
      {upcomingExpenses.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-500 text-sm uppercase tracking-wide mb-3">
            {t("Upcoming")}
          </h2>
          <div className="space-y-2">
            {upcomingExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-indigo-50 rounded-xl px-5 py-3.5 border border-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-gray-800">{expense.name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS.Other}`}
                    >
                      {t(expense.category)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(expense.amount)}
                    <span className="text-xs text-gray-400 font-normal">{t("/mo")}</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    {t("Starts:")} {formatMonthKey(expense.startMonth, locale)}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEdit(expense)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-indigo-500 hover:bg-green-50 transition-colors"
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
              </div>
            ))}
          </div>
        </div>
      )}

      {expenses.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t("No recurring expenses yet")}</p>
          <p className="text-sm mt-1">{t("Add your bills, subscriptions, and fixed costs")}</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          title={editing ? t("Edit Recurring Expense") : t("Add Recurring Expense")}
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
