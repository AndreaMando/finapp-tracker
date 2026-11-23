import { db } from "@/db";
import { installmentPlans, installmentPlanRevisions, oneTimeExpenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { currentTerms, dueInstallmentCount, installmentSlot, termsAt, type PlanRevision } from "@/lib/installment-math";

function utcMonthKey(now: Date): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

type RevisionRow = typeof installmentPlanRevisions.$inferSelect;

export function toPlanRevision(r: RevisionRow): PlanRevision {
  return {
    id: r.id,
    kind: r.kind === "extra" ? "extra" : "revision",
    fromInstallment: r.fromInstallment,
    payment: Number(r.payment),
    totalInstallments: r.totalInstallments,
    extraAmount: r.extraAmount === null ? null : Number(r.extraAmount),
    extraDate: r.extraDate,
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * Records every installment whose month has begun and that isn't recorded yet,
 * as a regular one-time expense. Called lazily from the read endpoints, so no
 * scheduler is needed: the first request of a new month (or the moment a plan
 * is created) catches the data up. Safe to call repeatedly or concurrently —
 * `generated_count` short-circuits the common case and a unique index on
 * (source_installment_id, installment_number) makes duplicate inserts no-ops.
 *
 * The expense is stored under the plan's plain name: the "(rata nr. X)" /
 * "(installment no. X)" label is composed when the expense is displayed, so it
 * follows the language the user has selected (see src/lib/expense-display.ts).
 * Each installment uses the payment in force for ITS number, so a recalculated
 * payment only affects the installments from the revision on.
 */
export async function materializeInstallments(userId: string): Promise<void> {
  const plans = await db.select().from(installmentPlans).where(eq(installmentPlans.userId, userId));
  if (plans.length === 0) return;

  const nowKey = utcMonthKey(new Date());
  let revisionsByPlan: Map<string, PlanRevision[]> | null = null;

  for (const plan of plans) {
    // Cheap pre-check with the base terms; revisions are only loaded when a plan
    // could actually have something new to record.
    if (plan.generatedCount >= plan.totalInstallments && plan.kind !== "mortgage") continue;

    if (!revisionsByPlan) {
      const all = await db.select().from(installmentPlanRevisions).where(eq(installmentPlanRevisions.userId, userId));
      revisionsByPlan = new Map();
      for (const r of all) {
        const list = revisionsByPlan.get(r.planId) ?? [];
        list.push(toPlanRevision(r));
        revisionsByPlan.set(r.planId, list);
      }
    }
    const revisions = revisionsByPlan.get(plan.id) ?? [];
    const base = { payment: Number(plan.amount), total: plan.totalInstallments };
    const total = currentTerms(base, revisions).total;

    const due = dueInstallmentCount(plan.startDate, total, nowKey);
    if (due <= plan.generatedCount) continue;

    const rows = [];
    for (let n = plan.generatedCount + 1; n <= due; n++) {
      const slot = installmentSlot(plan.startDate, n);
      const [y, m, d] = slot.isoDate.split("-").map(Number);
      rows.push({
        id: crypto.randomUUID(),
        userId,
        monthKey: slot.monthKey,
        name: plan.name,
        amount: termsAt(base, revisions, n).payment.toFixed(2),
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
