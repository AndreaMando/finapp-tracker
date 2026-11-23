// One shared list of expense categories for one-time expenses, recurring
// expenses and installment payments. The stored value is always the English
// key (translated for display with t()), so adding a category here never
// touches existing rows — every earlier category is still in the list.

export const CATEGORIES = [
  "Groceries",
  "Food & Dining",
  "Housing",
  "Home",
  "Utilities",
  "Phone & Internet",
  "Transport",
  "Health",
  "Sports & Wellness",
  "Personal Care",
  "Shopping",
  "Entertainment",
  "Travel",
  "Gifts",
  "Insurance",
  "Subscriptions",
  "Financing",
  "Mortgage",
  "Taxes & Fees",
  "Other",
] as const;

export const DEFAULT_CATEGORY: string = CATEGORIES[0];

// Category tag hues are data-categorization colors (same pattern as the
// per-goal colors elsewhere in the app), not part of the four core ledger tokens.
export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Groceries:           { bg: "#16a34a20", text: "#16a34a" },
  "Food & Dining":     { bg: "#ef444420", text: "#ef4444" },
  Housing:             { bg: "#ec489920", text: "#ec4899" },
  Home:                { bg: "#a855f720", text: "#a855f7" },
  Utilities:           { bg: "#f43f5e20", text: "#f43f5e" },
  "Phone & Internet":  { bg: "#0284c720", text: "#0284c7" },
  Transport:           { bg: "#0ea5e920", text: "#0ea5e9" },
  Health:              { bg: "#14b8a620", text: "#14b8a6" },
  "Sports & Wellness": { bg: "#d946ef20", text: "#d946ef" },
  "Personal Care":     { bg: "#3b82f620", text: "#3b82f6" },
  Shopping:            { bg: "#f9731620", text: "#f97316" },
  Entertainment:       { bg: "#eab30820", text: "#eab308" },
  Travel:              { bg: "#22c55e20", text: "#22c55e" },
  Gifts:               { bg: "#6366f120", text: "#6366f1" },
  Insurance:           { bg: "#06b6d420", text: "#06b6d4" },
  Subscriptions:       { bg: "#84cc1620", text: "#84cc16" },
  Financing:           { bg: "#f59e0b20", text: "#f59e0b" },
  Mortgage:            { bg: "#10b98120", text: "#10b981" },
  "Taxes & Fees":      { bg: "#64748b20", text: "#64748b" },
  Other:               { bg: "#9ca3af20", text: "#9ca3af" },
};

export function getCategoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
}
