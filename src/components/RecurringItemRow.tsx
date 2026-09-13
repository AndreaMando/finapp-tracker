"use client";

// components/recurring/RecurringItemRow.tsx

import { getCategoryStyle, type RecurringItem } from "./useRecurringApply";
import { SealedBadge } from "@/components/ui/SealedBadge";
import { useTranslation } from "@/lib/i18n";

interface Props {
  item: RecurringItem;
  checked: boolean;
  onToggle: () => void;
  onAmountChange: (value: string) => void;
}

function CustomCheckbox({
  checked,
  applied,
  label,
  onToggle,
}: {
  checked: boolean;
  applied: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={applied ? true : checked}
      aria-label={label}
      disabled={applied}
      onClick={onToggle}
      className={`
        w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center shrink-0
        transition-colors duration-150 cursor-pointer disabled:cursor-default
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sunken
        ${
          applied
            ? "border-hairline bg-surface-sunken"
            : checked
            ? "border-accent bg-accent"
            : "border-hairline bg-surface hover:border-accent"
        }
      `}
    >
      {(checked || applied) && (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
          <path
            d="M2 5.5L4.5 8L9 3"
            stroke={applied ? "var(--ink-faint)" : "var(--accent-contrast)"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export function RecurringItemRow({ item, checked, onToggle, onAmountChange }: Props) {
  const { t } = useTranslation();
  const style = getCategoryStyle(item.category);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 rounded-lg border transition-colors duration-150 ${
        item.isApplied
          ? "bg-surface-sunken border-hairline opacity-60"
          : checked
          ? "bg-accent/10 border-accent/30"
          : "bg-surface-sunken border-hairline"
      }`}
    >
      <CustomCheckbox
        checked={checked}
        applied={item.isApplied}
        label={
          item.isApplied
            ? `${item.name} — ${t("Applied")}`
            : `${checked ? t("Deselect") : t("Select")} ${item.name}`
        }
        onToggle={onToggle}
      />

      {/* Name + Category */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-medium text-sm truncate ${
              item.isApplied ? "text-ink-faint line-through" : "text-ink"
            }`}
          >
            {item.name}
          </span>
          {item.isApplied && <SealedBadge label={t("Applied")} className="shrink-0" />}
        </div>
        <span
          className="inline-block text-[11px] px-2 py-0.5 rounded-full font-semibold mt-1"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          {t(item.category)}
        </span>
      </div>

      {/* Amount */}
      <div className="shrink-0 flex items-center gap-1.5">
        <span className="text-xs text-ink-faint font-medium font-mono" aria-hidden="true">€</span>
        <label htmlFor={`amount-${item.id}`} className="sr-only">
          {t("Amount for")} {item.name}
        </label>
        <input
          id={`amount-${item.id}`}
          type="number"
          step="0.01"
          min="0"
          value={String(item.amount)}
          onChange={(e) => onAmountChange(e.target.value)}
          disabled={item.isApplied}
          className="w-20 px-3 py-2 rounded-md text-sm text-left bg-surface text-ink border border-hairline focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed tabular-nums font-mono [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:none]"
        />
      </div>
    </div>
  );
}
