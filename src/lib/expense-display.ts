// Expenses recorded by an installment plan or a mortgage are stored under the
// plan's plain name; the "(rata nr. X)" / "(anticipo)" label is composed here,
// when the expense is shown, so it follows the language currently selected.
// Rows recorded before this change have the label baked into their name (in
// whichever language was active then) — it is stripped and re-composed too.

const BAKED_LABEL = /\s*\((?:rata nr\.|installment no\.|anticipo|prepayment)(?:\s*\d+)?\)\s*$/i;

export function displayExpenseName(
  expense: { name: string; sourceInstallmentId?: string | null; installmentNumber?: number | null },
  t: (key: string) => string
): string {
  if (!expense.sourceInstallmentId) return expense.name;
  const base = expense.name.replace(BAKED_LABEL, "");
  if (expense.installmentNumber === null || expense.installmentNumber === undefined) {
    return `${base} (${t("prepayment")})`;
  }
  return `${base} (${t("installment no.")} ${expense.installmentNumber})`;
}
