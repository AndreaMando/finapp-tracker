"use client";

import { Check } from "lucide-react";

interface SealedBadgeProps {
  label: string;
  className?: string;
}

/**
 * "Sealed/verified" motif for completion states — a rotated ink-stamp disc
 * (double ring, slightly off-kilter, like something pressed onto a ledger
 * page) paired with a label. Shared by completed savings goals and applied
 * recurring expenses so "this is done and locked in" reads as one
 * deliberate brand moment tied to the ledger direction, not a generic
 * rounded-pill "verified" chip. Uses only existing accent tokens.
 */
export function SealedBadge({ label, className = "" }: SealedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 align-middle ${className}`}
    >
      <span
        className="relative w-5 h-5 shrink-0 flex items-center justify-center rounded-full border-[1.5px] border-accent text-accent -rotate-[10deg]"
        style={{ boxShadow: "inset 0 0 0 2px transparent, inset 0 0 0 3px currentColor" }}
        aria-hidden="true"
      >
        {/* double ring: outer border above, a slightly inset second ring below */}
        <span className="absolute inset-[2.5px] rounded-full border border-accent/70" />
        <Check size={10} strokeWidth={3} className="relative" />
      </span>
      <span className="text-[11px] font-mono font-semibold uppercase tracking-wide leading-none text-accent -rotate-[2deg]">
        {label}
      </span>
    </span>
  );
}
