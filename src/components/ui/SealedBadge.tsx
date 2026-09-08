"use client";

import { BadgeCheck } from "lucide-react";

interface SealedBadgeProps {
  label: string;
  className?: string;
}

/**
 * "Sealed/verified" motif for completion states — a small mint BadgeCheck
 * tile paired with a label. Shared by completed savings goals and applied
 * recurring expenses so "this is done and locked in" reads as one
 * deliberate brand moment across the app instead of plain colored text.
 * Uses only existing mint tokens (#00FFA3 / #00FFA315), no new color.
 */
export function SealedBadge({ label, className = "" }: SealedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full align-middle ${className}`}
      style={{ backgroundColor: "#00FFA315" }}
    >
      <span
        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: "#00FFA3" }}
        aria-hidden="true"
      >
        <BadgeCheck size={11} color="#0d0d0d" strokeWidth={2.5} />
      </span>
      <span className="text-[11px] font-semibold leading-none" style={{ color: "#00FFA3" }}>
        {label}
      </span>
    </span>
  );
}
