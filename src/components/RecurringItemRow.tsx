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
  const boxStyle: React.CSSProperties = {
    width: 15,
    height: 15,
    borderRadius: 6,
    border: `2px solid ${applied ? "#374151" : checked ? "#00FFA3" : "transparent"}`,
    backgroundColor: applied ? "#252830" : checked ? "#00FFA3" : "#252830",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 150ms",
    cursor: applied ? "" : "pointer",
    outline: "none",
  };
 
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={applied ? true : checked}
      aria-label={label}
      disabled={applied}
      onClick={onToggle}
      style={boxStyle}
      onMouseEnter={(e) => {
        if (!applied && !checked) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#00FFA3";
        }
      }}
      onMouseLeave={(e) => {
        if (!applied && !checked) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#374151";
        }
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 2px #0d0d0d, 0 0 0 4px #00FFA3";
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      {(checked || applied) && (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
          <path
            d="M2 5.5L4.5 8L9 3"
            stroke={applied ? "#6b7280" : checked ? "#0d0d0d" : ""}
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

  const rowStyle: React.CSSProperties = {
    border: `1px solid ${
      item.isApplied ? "#1a1d24" : checked ? "#00FFA330" : "#1a1d24"
    }`,
    backgroundColor: item.isApplied ? "#0d0d0d" : checked ? "#00FFA308" : "#111318",
    opacity: item.isApplied ? 0.5 : 1,
    borderRadius: 12,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    transition: "all 150ms",
  };
 
  return (
    <div style={rowStyle}>
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
            className="font-medium text-sm truncate"
            style={{
              color: item.isApplied ? "#6b7280" : "#e5e7eb",
              textDecoration: item.isApplied ? "line-through" : "none",
            }}
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
        <span className="text-xs text-[#6b7280] font-medium" aria-hidden="true">€</span>
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
          className="w-20 px-3 py-2 rounded-lg text-sm text-left bg-[#0d0d0d] text-white border border-[#252830] focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3] disabled:opacity-40 disabled:cursor-not-allowed tabular-nums [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [appearance:none]"
        />
      </div>
    </div>
  );
}