"use client";

// components/recurring/RecurringItemRow.tsx

import { getCategoryStyle, type RecurringItem } from "./useRecurringApply";
import { useTranslation } from "@/lib/i18n";

interface Props {
  item: RecurringItem;
  checked: boolean;
  onToggle: () => void;
  onAmountChange: (value: string) => void;
}

export function RecurringItemRow({ item, checked, onToggle, onAmountChange }: Props) {
  const { t } = useTranslation();
  const style = getCategoryStyle(item.category);
  const checkboxId = `checkbox-${item.id}`;

  return (
    <div
      className={`
        border rounded-xl px-4 py-3.5 flex items-center gap-3
        transition-all duration-150
        ${item.isApplied
          ? "bg-[#0d0d0d] border-[#1a1d24] opacity-50"
          : checked
          ? "bg-[#00FFA308] border-[#00FFA330]"
          : "bg-[#111318] border-[#1a1d24] hover:border-[#252830]"
        }
      `}
    >
      {/*
        Correct peer technique: input and label must be direct siblings in the same flex container. 
        The peer applies only to the immediately following sibling with + or ~ in CSS.
        Structure: <div> → <input peer /> + <label peer-checked:.../>
      */}
      <div className="relative shrink-0 flex items-center justify-center w-5 h-5">
        {/* Native invisible input - manages the native browser state */}
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={() => { if (!item.isApplied) onToggle(); }}
          disabled={item.isApplied}
          aria-label={
            item.isApplied
              ? `${item.name} — ${t("Applied")}`
              : `${checked ? t("Deselect") : t("Select")} ${item.name}`
          }
          className="
            peer
            absolute inset-10
            opacity-0 m-0
            cursor-pointer disabled:cursor-not-allowed
            z-10
          "
        />
        {/*
          Visible label — direct sibling of the input thanks to both being direct children of the same div.
          peer-checked: works because input[peer] + label is a CSS sibling.
        */}
        <div
          aria-hidden="true"
          className={`
            absolute inset-10 rounded-md border-2
            flex items-center justify-center
            transition-all duration-150
            peer-focus-visible:ring-2 peer-focus-visible:ring-[#00FFA3]
            peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#111318]
            ${item.isApplied
              ? "bg-[#252830] border-[#252830]"
              : checked
              ? "bg-[#00FFA3] border-[#00FFA3]"
              : !checked
              ? "bg-[#252830] border-transparent"
              : "bg-transparent border-[#374151]"
            }
          `}
        >
          {(!checked || checked || item.isApplied) && (
            <svg width="15" height="15" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path
                d="M2 5.5L4.5 8L9 3"
                stroke={item.isApplied ? "#6b7280" : checked ? "#0d0d0d" : ""}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Name + Category */}
      <div className="min-w-0 flex-1 ml-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-medium text-sm truncate ${
              item.isApplied ? "text-[#6b7280] line-through" : "text-[#e5e7eb]"
            }`}
          >
            {item.name}
          </span>
          {item.isApplied && (
            <span className="shrink-0 text-[12px] px-2 py-0.5 rounded-full bg-[#00FFA315] text-[#00FFA3] font-semibold">
              {t("Applied")}
            </span>
          )}
        </div>
        <span
          className="inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1"
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
          className="
            w-20 px-3 py-2 rounded-lg text-sm text-left
            bg-[#0d0d0d] text-white border border-[#252830]
            focus:outline-none focus:ring-1 focus:ring-[#00FFA3] focus:border-[#00FFA3]
            disabled:opacity-40 disabled:cursor-not-allowed
            tabular-nums
            [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none
            [appearance:none]
          "
        />
      </div>
    </div>
  );
}