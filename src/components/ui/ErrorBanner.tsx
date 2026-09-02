"use client";

import { AlertCircle } from "lucide-react";

/**
 * Inline error banner shown after a failed mutation (delete/update) that
 * would otherwise fail silently — see store.ts's mutate() helper, which
 * throws with a readable message on any non-OK response.
 */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4"
    >
      <AlertCircle size={14} className="shrink-0 text-red-400" aria-hidden="true" />
      <p className="text-xs font-medium text-red-400">{message}</p>
    </div>
  );
}
