import { cookies } from "next/headers";
import { db } from "@/db";
import { installmentPlans, oneTimeExpenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { dueInstallmentCount, installmentSlot } from "@/lib/installment-math";

function utcMonthKey(now: Date): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

// The installment number is baked into the expense title, so it follows the
// language the user has selected at the moment the installment is recorded.
async function installmentSuffix(): Promise<(n: number) => string> {
  let lang = "en";
  try {
    const store = await cookies();
    lang = store.get("vaulty_language")?.value ?? "en";
  } catch {
    // outside a request scope — fall back to English
  }
  return lang === "it" ? (n) => `(rata nr. ${n})` : (n) => `(installment no. ${n})`;
}

/**
 * Records every installment whose month has begun and that isn't recorded yet,
 * as a regular one-time expense. Called lazily from the read endpoints, so no
 * scheduler is needed: the first request of a new month (or the moment a plan
 * is created) catches the data up. Safe to call repeatedly or concurrently —
 * `generated_count` short-circuits the common case and a unique index on
 * (source_installment_id, installment_number) makes duplicate inserts no-ops.
 */
export async function materializeInstallments(userId: string): Promise<void> {
  const plans = await db.select().from(installmentPlans).where(eq(installmentPlans.userId, userId));
  if (plans.length === 0) return;

  const nowKey = utcMonthKey(new Date());
  const suffix = await installmentSuffix();

  for (const plan of plans) {
    const due = dueInstallmentCount(plan.startDate, plan.totalInstallments, nowKey);
    if (due <= plan.generatedCount) continue;

    const rows = [];
    for (let n = plan.generatedCount + 1; n <= due; n++) {
      const slot = installmentSlot(plan.startDate, n);
      const [y, m, d] = slot.isoDate.split("-").map(Number);
      rows.push({
        id: crypto.randomUUID(),
        userId,
        monthKey: slot.monthKey,
        name: `${plan.name} ${suffix(n)}`,
        amount: plan.amount,
        category: plan.category,
        // noon UTC keeps the calendar day stable in any timezone
        date: new Date(Date.UTC(y, m - 1, d, 12)),
        sourceInstallmentId: plan.id,
        installmentNumber: n,
      });
    }

    await db.insert(oneTimeExpenses).values(rows).onConflictDoNothing();
    await db.update(installmentPlans).set({ generatedCount: due }).where(eq(installmentPlans.id, plan.id));
  }
}
