"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Square, RefreshCw, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { currentMonthKey, formatMonthKey } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { useRecurringApply } from "./useRecurringApply";
import { RecurringItemRow } from "./RecurringItemRow";

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-[#1a1d24] rounded-xl animate-pulse ${className}`} aria-hidden="true" />;
}

function RecurringApplySkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Caricamento...">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#111318] border border-[#1a1d24] rounded-xl px-4 py-3.5 flex items-center gap-3">
          <Skeleton className="w-5 h-5 rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="w-24 h-9 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal component
// ─────────────────────────────────────────────
export function RecurringApplyModal({
  monthKey = currentMonthKey(),
  onClose,
  onApplied,
}: {
  monthKey?: string;
  onClose: () => void;
  onApplied?: () => void;
}) {
  const { t, lang } = useTranslation();
  const locale = lang === "it" ? "it-IT" : "en-US";

  const {
    items, selected, loading, applying, error,
    pendingCount, selectedCount, allSelected,
    toggle, setAmount, selectAll, deselectAll, handleApply,
  } = useRecurringApply(monthKey, () => { onApplied?.(); onClose(); });

  const appliedCount = items.filter((i) => i.isApplied).length;
  const canApply = selectedCount > 0 && !applying;

  return (
    <Modal title={t("Apply Recurring Expenses")} onClose={onClose} containerClassName="max-w-lg">
      <div className="space-y-4">

        {/* Month + stats header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              {formatMonthKey(monthKey, locale)}
            </p>
            {!loading && (
              <p className="text-xs text-[#6b7280] mt-0.5">
                {appliedCount > 0
                  ? `${appliedCount} ${t("already applied")} · `
                  : ""}
                {selectedCount} {t("of")} {pendingCount} {t("selected")}
              </p>
            )}
          </div>

          {/* P2: select/deselect all toggle */}
          {!loading && pendingCount > 0 && (
            <button
              onClick={allSelected ? deselectAll : selectAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#00FFA3] hover:text-[#00ffb3] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3] rounded px-1"
            >
              {allSelected
                ? <><Square size={13} aria-hidden="true" /> {t("Deselect all")}</>
                : <><CheckSquare size={13} aria-hidden="true" /> {t("Select all")}</>
              }
            </button>
          )}
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              role="alert"
              className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
            >
              <AlertCircle size={13} className="text-red-400 shrink-0" aria-hidden="true" />
              <p className="text-xs text-red-400 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <div
          className="space-y-2 max-h-[55vh] overflow-y-auto pr-0.5"
          role="list"
          aria-label={t("Recurring expenses to apply")}
        >
          {loading ? (
            <RecurringApplySkeleton />
          ) : items.length === 0 ? (
            <div className="text-center py-10">
              <RefreshCw size={32} className="mx-auto mb-3 text-[#252830]" aria-hidden="true" />
              <p className="text-sm text-[#6b7280]">{t("No recurring items for this month")}</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} role="listitem">
                <RecurringItemRow
                  item={item}
                  checked={!!selected[item.id]}
                  onToggle={() => toggle(item.id)}
                  onAmountChange={(v) => setAmount(item.id, v)}
                />
              </div>
            ))
          )}
        </div>

        {/* Progress bar — shows how many are applied */}
        {!loading && items.length > 0 && appliedCount > 0 && (
          <div
            className="w-full bg-[#1a1d24] rounded-full h-1 overflow-hidden"
            role="progressbar"
            aria-valuenow={appliedCount}
            aria-valuemin={0}
            aria-valuemax={items.length}
            aria-label={`${appliedCount} ${t("of")} ${items.length} ${t("applied")}`}
          >
            <div
              className="h-full bg-[#00FFA3] rounded-full transition-all duration-500"
              style={{ width: `${(appliedCount / items.length) * 100}%` }}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleApply}
            disabled={!canApply}
            aria-busy={applying}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-[#00FFA3] hover:bg-[#00ffb3] active:scale-[0.98] text-[#0d0d0d] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#00FFA3] focus:ring-offset-2 focus:ring-offset-[#1a1d24]"
          >
            {applying
              ? t("Applying...")
              : selectedCount > 0
              ? `${t("Apply")} ${selectedCount} ${t(selectedCount === 1 ? "expense" : "expenses")}`
              : t("Apply selected")
            }
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#252830] hover:bg-[#2e3340] active:scale-[0.98] text-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9ca3af] focus:ring-offset-2 focus:ring-offset-[#1a1d24]"
          >
            {t("Cancel")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default RecurringApplyModal;
