// hooks/useRecurringApply.ts
// Shared logic between RecurringApplyModal and RecurringApplyPanel

import { useEffect, useState } from "react";
import { previewRecurringForMonth, applyRecurringSelections } from "@/lib/store";

export interface RecurringItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  isApplied: boolean;
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Housing:       { bg: "#60a5fa20", text: "#60a5fa" },
  Utilities:     { bg: "#fbbf2420", text: "#fbbf24" },
  Insurance:     { bg: "#a78bfa20", text: "#a78bfa" },
  Subscriptions: { bg: "#f472b620", text: "#f472b6" },
  Transport:     { bg: "#fb923c20", text: "#fb923c" },
  Health:        { bg: "#4ade8020", text: "#4ade80" },
  Financing:     { bg: "#a3e63520", text: "#a3e635" },
  Mortgage:      { bg: "#818cf820", text: "#818cf8" },
  Other:         { bg: "#9ca3af20", text: "#9ca3af" },
};

export function getCategoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
}

export function useRecurringApply(monthKey: string, onApplied?: () => void) {
  const [items, setItems]       = useState<RecurringItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading]   = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    async function load() {
      try {
        const data = await previewRecurringForMonth(monthKey);
        if (cancelled) return;
        setItems(data.map((d: RecurringItem) => ({ ...d })));
        const initial: Record<string, boolean> = {};
        data.forEach((d: RecurringItem) => { if (!d.isApplied) initial[d.id] = true; });
        setSelected(initial);
      } catch {
        if (!cancelled) setError("Failed to load recurring expenses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [monthKey]);

  const pendingCount = items.filter((i) => !i.isApplied).length;
  const selectedCount = items.filter((i) => selected[i.id] && !i.isApplied).length;
  const allSelected = pendingCount > 0 && selectedCount === pendingCount;

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function setAmount(id: string, value: string) {
    setItems((it) =>
      it.map((i) => (i.id === id ? { ...i, amount: Number(value || 0) } : i))
    );
  }

  function selectAll() {
    const all: Record<string, boolean> = {};
    items.forEach((i) => { if (!i.isApplied) all[i.id] = true; });
    setSelected(all);
  }

  function deselectAll() {
    setSelected({});
  }

  async function handleApply() {
    setApplying(true);
    setError("");
    const toApply = items
      .filter((i) => selected[i.id] && !i.isApplied)
      .map((i) => ({ id: i.id, amount: i.amount }));
    try {
      await applyRecurringSelections(monthKey, toApply);
      onApplied?.();
    } catch {
      setError("Failed to apply. Please try again.");
    } finally {
      setApplying(false);
    }
  }

  return {
    items, selected, loading, applying, error,
    pendingCount, selectedCount, allSelected,
    toggle, setAmount, selectAll, deselectAll, handleApply,
  };
}
