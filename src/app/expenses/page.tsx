"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import {
  currentMonthKey,
  formatMonthKey,
  formatDate,
  getOneTimeExpensesForMonth,
  addOneTimeExpense,
  deleteOneTimeExpense,
  getTotalOneTimeForMonth,
  type OneTimeExpense,
} from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/lib/i18n";

const CATEGORIES = [
  "Food & Dining",
  "Shopping",
  "Entertainment",
  "Travel",
  "Health",
  "Personal Care",
  "Gifts",
  "Home",
  "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "bg-orange-100 text-orange-700",
  Shopping: "bg-pink-100 text-pink-700",
  Entertainment: "bg-purple-100 text-purple-700",
  Travel: "bg-blue-100 text-blue-700",
  Health: "bg-green-100 text-green-700",
  "Personal Care": "bg-teal-100 text-teal-700",
  Gifts: "bg-red-100 text-red-700",
  Home: "bg-yellow-100 text-yellow-700",
  Other: "bg-gray-100 text-gray-600",
};

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

interface ExpenseFormProps {
  monthKey: string;
  onSave: () => void;
  onClose: () => void;
}

function ExpenseForm({ monthKey, onSave, onClose }: ExpenseFormProps) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const today = new Date().toISOString().split("T")[0];
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(today);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t("Name is required.");
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) e.amount = t("Enter a valid amount.");
    if (!date) e.date = t("Date is required.");
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    await addOneTimeExpense(monthKey, name.trim(), parseFloat(amount), category, date);
    onSave();
    onClose();
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("Description")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
          placeholder={t("e.g. Dinner at restaurant")}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Amount")} (€) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: "" })); }}
            placeholder="0.00"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Date")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: "" })); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 opacity-0 absolute inset-0 cursor-pointer"
            />
            <span className="block w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm pointer-events-none capitalize">
              {date ? formatDate(date, locale) : "\u00A0"}
            </span>
          </div>
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
        </div>
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
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">{t("Add Expense")}</Button>
        <Button type="button" variant="secondary" onClick={onClose}>{t("Cancel")}</Button>
      </div>
    </form>
  );
}

function groupByCategory(expenses: OneTimeExpense[]): Record<string, OneTimeExpense[]> {
  return expenses.reduce<Record<string, OneTimeExpense[]>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = [];
    acc[e.category].push(e);
    return acc;
  }, {});
}

export default function ExpensesPage() {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [expenses, setExpenses] = useState<OneTimeExpense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    async function load() {
      const data = await getOneTimeExpensesForMonth(monthKey);
      data.sort((a, b) => b.date.localeCompare(a.date));
      setExpenses(data);
    }
    load();
  }, [monthKey, refresh]);

  async function handleDelete(id: string) {
    if (confirm(t("Delete this expense?"))) {
      await deleteOneTimeExpense(id);
      setRefresh((r) => r + 1);
    }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const grouped = groupByCategory(expenses);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("Expenses")}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t("One-time and variable spending")}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} />
          {t("Add Expense")}
        </Button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm w-fit mb-6">
        <button
          onClick={() => setMonthKey(addMonths(monthKey, -1))}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-gray-700 min-w-[130px] text-center">
          {formatMonthKey(monthKey, locale)}
        </span>
        <button
          onClick={() => setMonthKey(addMonths(monthKey, 1))}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
          <ShoppingBag size={22} className="text-red-500" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{t("Total for")} {formatMonthKey(monthKey, locale)}</p>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(total)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {expenses.length} {t(expenses.length === 1 ? "expense" : "expenses")}
          </p>
        </div>
      </div>

      {/* Expenses by Category */}
      {expenses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t("No expenses for this month")}</p>
          <p className="text-sm mt-1">{t("Track your spending by adding expenses")}</p>
          <Button className="mt-4" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            {t("Add First Expense")}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => {
            const catTotal = items.reduce((s, e) => s + e.amount, 0);
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other}`}
                  >
                    {t(cat)}
                  </span>
                  <span className="text-sm font-semibold text-gray-600">
                    {formatCurrency(catTotal)}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((expense) => (
                    <div
                      key={expense.id}
                      className="bg-white rounded-xl px-5 py-3.5 shadow-sm border border-gray-100 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{expense.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(expense.date, locale)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(expense.amount)}
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
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={t("Add Expense")} onClose={() => setShowModal(false)}>
          <ExpenseForm
            monthKey={monthKey}
            onSave={() => setRefresh((r) => r + 1)}
            onClose={() => setShowModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}
