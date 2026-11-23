import { NextResponse } from "next/server";
import { db } from "@/db";
import { installmentPlans, installmentPlanRevisions, oneTimeExpenses } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { materializeInstallments, toPlanRevision } from "@/lib/installments-server";
import { MAX_INSTALLMENTS, currentTerms, installmentsPaidBy, parseIsoDate } from "@/lib/installment-math";

// Records an early repayment ("anticipo") on a mortgage: one expense for the
// amount paid, plus a revision with the plan's terms afterwards — either the
// same payment over a shorter duration, or a lower payment over the same
// duration. The client proposes both from the mortgage maths and the user can
// override them with the bank's figures.
export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
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
    if (plan.kind !== "mortgage") return NextResponse.json({ error: "Only mortgages accept extra payments" }, { status: 400 });

    await materializeInstallments(userId);
    const [fresh] = await db.select().from(installmentPlans).where(eq(installmentPlans.id, plan.id));
    const generated = fresh?.generatedCount ?? plan.generatedCount;

    const revisionRows = await db
      .select()
      .from(installmentPlanRevisions)
      .where(eq(installmentPlanRevisions.planId, plan.id));
    const terms = currentTerms(
      { payment: Number(plan.amount), total: plan.totalInstallments },
      revisionRows.map(toPlanRevision)
    );

    const { amount, date, payment, totalInstallments } = await req.json();
    const parsedAmount = Number(amount);
    const parsedPayment = Number(payment);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (typeof date !== "string" || !parseIsoDate(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    if (!Number.isFinite(parsedPayment) || parsedPayment <= 0) {
      return NextResponse.json({ error: "Invalid payment" }, { status: 400 });
    }

    // The new terms apply from the first installment after the extra payment,
    // and never before one that is already recorded.
    const from = Math.max(installmentsPaidBy(plan.startDate, terms.total, date) + 1, generated + 1);
    if (from > terms.total + 1) return NextResponse.json({ error: "The mortgage is already paid off" }, { status: 400 });
    if (!Number.isInteger(totalInstallments) || totalInstallments < from - 1 || totalInstallments > MAX_INSTALLMENTS) {
      return NextResponse.json({ error: "Invalid number of installments" }, { status: 400 });
    }

    const [y, m, d] = date.split("-").map(Number);
    const expenseId = crypto.randomUUID();
    await db.insert(oneTimeExpenses).values({
      id: expenseId,
      userId,
      monthKey: `${y}-${String(m).padStart(2, "0")}`,
      name: plan.name,
      amount: parsedAmount.toFixed(2),
      category: plan.category,
      date: new Date(Date.UTC(y, m - 1, d, 12)),
      sourceInstallmentId: plan.id,
      installmentNumber: null,
    });

    await db.insert(installmentPlanRevisions).values({
      id: crypto.randomUUID(),
      planId: plan.id,
      userId,
      kind: "extra",
      fromInstallment: from,
      payment: parsedPayment.toFixed(2),
      totalInstallments,
      extraAmount: parsedAmount.toFixed(2),
      extraDate: date,
      expenseId,
    });

    await materializeInstallments(userId);

    const [updated] = await db.select().from(installmentPlans).where(eq(installmentPlans.id, plan.id));
    const revisions = await db
      .select()
      .from(installmentPlanRevisions)
      .where(eq(installmentPlanRevisions.planId, plan.id));
    return NextResponse.json({ ...updated, revisions: revisions.map(toPlanRevision) });
  } catch (error) {
    console.error("Installments extra Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
