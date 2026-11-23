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

// Category tag colors now come from the single shared list in src/lib/categories.ts
// so a category looks the same in the expense lists and in the apply panel.
export { getCategoryStyle } from "@/lib/categories";

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
