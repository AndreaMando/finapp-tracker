"use client";

import { Modal } from "@/components/ui/Modal";
import { currentMonthKey } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import RecurringApplyPanel from "./RecurringApplyPanel";

// ─────────────────────────────────────────────
// Modal component — thin wrapper around RecurringApplyPanel so the two
// surfaces (dashboard section + modal) always share one implementation,
// including the slide-to-confirm apply gesture.
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
  const { t } = useTranslation();

  return (
    <Modal title={t("Apply Recurring Expenses")} onClose={onClose} containerClassName="max-w-lg">
      <div className="space-y-4">
        <RecurringApplyPanel
          monthKey={monthKey}
          onApplied={() => {
            onApplied?.();
            onClose();
          }}
        />

        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg text-sm font-semibold bg-surface-sunken hover:bg-hairline text-ink transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {t("Cancel")}
        </button>
      </div>
    </Modal>
  );
}

export default RecurringApplyModal;
