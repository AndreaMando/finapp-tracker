"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, TrendingUp } from "lucide-react";
import {
  currentMonthKey,
  formatMonthKey,
  getIncomes,
  upsertIncome,
  deleteIncome,
  type MonthlyIncome,
} from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

function addMonths(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface IncomeFormProps {
  monthKey: string;
  existing?: MonthlyIncome;
  onSave: () => void;
  onClose: () => void;
}

function IncomeForm({ monthKey, existing, onSave, onClose }: IncomeFormProps) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const [amount, setAmount] = useState(existing?.amount.toString() ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError(t("Please enter a valid amount greater than 0."));
      return;
    }
    await upsertIncome(monthKey, parsed, note);
    onSave();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          {t("Amount")} (€) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          placeholder={t("e.g. 2500.00")}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("Note (optional)")}
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("e.g. Salary + bonus")}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {existing ? t("Update Income") : t("Save Income")}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          {t("Cancel")}
        </Button>
      </div>
    </form>
  );
}

export default function IncomePage() {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [allIncomes, setAllIncomes] = useState<MonthlyIncome[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    async function load() {
      const data = (await getIncomes()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
      setAllIncomes(data);
    }
    load();
  }, [refresh]);

  const currentIncome = allIncomes.find((i) => i.monthKey === monthKey);

  async function handleDelete(id: string) {
    if (confirm(t("Delete this income entry?"))) {
      await deleteIncome(id);
      setRefresh((r) => r + 1);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("Income")}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t("Record your monthly earnings")}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} />
          {t("Set Income")}
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

      {/* Current Month Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t("Income for")}</p>
            <p className="font-semibold text-gray-800">{formatMonthKey(monthKey, locale)}</p>
          </div>
        </div>
        {currentIncome ? (
          <div className="mt-4">
            <p className="text-3xl font-bold text-emerald-600">
              {formatCurrency(currentIncome.amount)}
            </p>
            {currentIncome.note && (
              <p className="text-sm text-gray-400 mt-1">{currentIncome.note}</p>
            )}
            <div className="flex gap-2 mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowModal(true)}
              >
                <Pencil size={14} />
                {t("Edit")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(currentIncome.id)}
              >
                <Trash2 size={14} />
                {t("Delete")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-gray-400 text-sm">{t("No income recorded for this month.")}</p>
            <Button className="mt-3" size="sm" onClick={() => setShowModal(true)}>
              <Plus size={14} />
              {t("Add Income")}
            </Button>
          </div>
        )}
      </div>

      {/* History */}
      <h2 className="font-semibold text-gray-800 mb-3">{t("Income History")}</h2>
      {allIncomes.length === 0 ? (
        <p className="text-gray-400 text-sm">{t("No income entries yet.")}</p>
      ) : (
        <div className="space-y-2">
          {allIncomes.map((income) => (
            <div
              key={income.id}
              className="bg-white rounded-xl px-5 py-3.5 shadow-sm border border-gray-100 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-800">{formatMonthKey(income.monthKey, locale)}</p>
                {income.note && (
                  <p className="text-xs text-gray-400 mt-0.5">{income.note}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(income.amount)}
                </span>
                <button
                  onClick={() => handleDelete(income.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          title={currentIncome ? t("Edit Income") : t("Set Income")}
          onClose={() => setShowModal(false)}
        >
          <IncomeForm
            monthKey={monthKey}
            existing={currentIncome}
            onSave={() => setRefresh((r) => r + 1)}
            onClose={() => setShowModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}
