import { NextResponse } from "next/server";
import { db } from "@/db";
import { installmentPlans, installmentPlanRevisions, oneTimeExpenses } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { materializeInstallments } from "@/lib/installments-server";

// Removes a change that has not taken effect yet (it starts at an installment
// that is not recorded). Anything already applied to recorded installments is
// history and stays; for an extra payment the expense is removed with it.
export async function DELETE(_req: Request, props: { params: Promise<{ id: string; revisionId: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  await materializeInstallments(userId);

  const [plan] = await db
    .select()
    .from(installmentPlans)
    .where(and(eq(installmentPlans.id, params.id), eq(installmentPlans.userId, userId)));
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [revision] = await db
    .select()
    .from(installmentPlanRevisions)
    .where(and(eq(installmentPlanRevisions.id, params.revisionId), eq(installmentPlanRevisions.planId, plan.id)));
  if (!revision) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (revision.fromInstallment <= plan.generatedCount) {
    return NextResponse.json({ error: "This change already applies to recorded installments" }, { status: 400 });
  }

  if (revision.expenseId) {
    await db
      .delete(oneTimeExpenses)
      .where(and(eq(oneTimeExpenses.id, revision.expenseId), eq(oneTimeExpenses.userId, userId)));
  }
  await db.delete(installmentPlanRevisions).where(eq(installmentPlanRevisions.id, revision.id));

  return NextResponse.json({ success: true });
}
