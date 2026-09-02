"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ConfirmDialogProps {
  /** Dialog title, e.g. t("Confirm Deletion"). Defaults to a generic deletion title. */
  title?: string;
  message: string;
  /** Label for the destructive button. Defaults to t("Delete"). */
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  reduceMotion: boolean;
}

/**
 * Shared accessible confirm dialog — was previously copy-pasted with minor
 * variations into expenses/income/goals/recurring pages. Keep it here so
 * a11y fixes (focus trap, Escape handling, role="dialog") only need to
 * happen once.
 */
export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, reduceMotion }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // P1: focus trap — focus cancel button on open
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // P1: close on Escape, keep Tab focus cycling inside the dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} aria-hidden="true" />
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
        transition={{ duration: reduceMotion ? 0 : 0.15, ease: "easeOut" as const }}
        className="relative z-10 bg-[#1a1d24] border border-[#252830] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-400" aria-hidden="true" />
          </div>
          <div>
            <p id="confirm-title" className="text-sm font-semibold text-white">
              {title ?? t("Confirm Deletion")}
            </p>
            <p id="confirm-desc" className="text-xs text-[#9ca3af] mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            {confirmLabel ?? t("Delete")}
          </button>
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#252830] text-white hover:bg-[#2e3340] active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]"
          >
            {t("Cancel")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
