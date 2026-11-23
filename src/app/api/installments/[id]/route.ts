import { NextResponse } from "next/server";
import { db } from "@/db";
import { installmentPlans, installmentPlanRevisions, oneTimeExpenses } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { materializeInstallments, toPlanRevision } from "@/lib/installments-server";
import { MAX_INSTALLMENTS, MIN_INSTALLMENTS, currentTerms, parseIsoDate } from "@/lib/installment-math";

// Deleting a plan stops the installments that haven't been recorded yet. The
// ones already recorded stay in the one-time expenses on purpose: that money
// was really spent.
export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db
    .delete(installmentPlans)
    .where(and(eq(installmentPlans.id, params.id), eq(installmentPlans.userId, session.user.id)));

  return NextResponse.json({ success: true });
}

// Edits a plan after creation (used by the mortgage page):
//   name            also renames the expenses already recorded for the plan
//   financedAmount  borrowed capital, can be filled in later or cleared (null)
//   startDate       only while nothing has been recorded yet
//   revision        new payment / total from a given installment on (e.g. the
//                   bank recalculated the variable-rate payment); installments
//                   already recorded are never rewritten
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  try {
    const [plan] = await db
      .select()
      .from(installmentPlans)
      .where(and(eq(installmentPlans.id, params.id), eq(installmentPlans.userId, userId)));
    if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Make sure generatedCount is up to date before validating against it.
    await materializeInstallments(userId);
    const [fresh] = await db.select().from(installmentPlans).where(eq(installmentPlans.id, plan.id));
    const generated = fresh?.generatedCount ?? plan.generatedCount;

    const revisionRows = await db
      .select()
      .from(installmentPlanRevisions)
      .where(eq(installmentPlanRevisions.planId, plan.id));

    const body = await req.json();
    const updates: Partial<typeof installmentPlans.$inferInsert> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 200) {
        return NextResponse.json({ error: "Invalid name" }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.financedAmount !== undefined) {
      if (plan.kind !== "mortgage") {
        return NextResponse.json({ error: "Only mortgages have a financed amount" }, { status: 400 });
      }
      if (body.financedAmount === null || body.financedAmount === "") {
        updates.financedAmount = null;
      } else {
        const n = Number(body.financedAmount);
        if (!Number.isFinite(n) || n <= 0) return NextResponse.json({ error: "Invalid financed amount" }, { status: 400 });
        updates.financedAmount = n.toFixed(2);
      }
    }

    if (body.startDate !== undefined && body.startDate !== plan.startDate) {
      if (generated > 0 || revisionRows.length > 0) {
        return NextResponse.json({ error: "The start date cannot change once installments are recorded" }, { status: 400 });
      }
      if (typeof body.startDate !== "string" || !parseIsoDate(body.startDate)) {
        return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
      }
      updates.startDate = body.startDate;
    }

    let newRevision: typeof installmentPlanRevisions.$inferInsert | null = null;
    if (body.revision) {
      const { payment, totalInstallments, fromInstallment } = body.revision;
      const terms = currentTerms(
        { payment: Number(plan.amount), total: plan.totalInstallments },
        revisionRows.map(toPlanRevision)
      );
      const parsedPayment = Number(payment);
      if (!Number.isFinite(parsedPayment) || parsedPayment <= 0) {
        return NextResponse.json({ error: "Invalid payment" }, { status: 400 });
      }
      if (!Number.isInteger(totalInstallments) || totalInstallments < MIN_INSTALLMENTS || totalInstallments > MAX_INSTALLMENTS) {
        return NextResponse.json({ error: "Invalid number of installments" }, { status: 400 });
      }
      // Recorded installments are history: a change can only start after them.
      if (!Number.isInteger(fromInstallment) || fromInstallment < generated + 1 || fromInstallment > terms.total) {
        return NextResponse.json({ error: "Invalid starting installment" }, { status: 400 });
      }
      if (totalInstallments < Math.max(generated, fromInstallment - 1)) {
        return NextResponse.json({ error: "Number of installments is lower than those already paid" }, { status: 400 });
      }
      newRevision = {
        id: crypto.randomUUID(),
        planId: plan.id,
        userId,
        kind: "revision",
        fromInstallment,
        payment: parsedPayment.toFixed(2),
        totalInstallments,
      };
    }

    if (Object.keys(updates).length > 0) {
      await db.update(installmentPlans).set(updates).where(eq(installmentPlans.id, plan.id));
    }
    if (updates.name) {
      await db
        .update(oneTimeExpenses)
        .set({ name: updates.name })
        .where(and(eq(oneTimeExpenses.sourceInstallmentId, plan.id), eq(oneTimeExpenses.userId, userId)));
    }
    if (newRevision) await db.insert(installmentPlanRevisions).values(newRevision);

    // A longer plan or an earlier start may have installments due right away.
    await materializeInstallments(userId);

    const [updated] = await db.select().from(installmentPlans).where(eq(installmentPlans.id, plan.id));
    const revisions = await db
      .select()
      .from(installmentPlanRevisions)
      .where(eq(installmentPlanRevisions.planId, plan.id));
    return NextResponse.json({ ...updated, revisions: revisions.map(toPlanRevision) });
  } catch (error) {
    console.error("Installments PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
