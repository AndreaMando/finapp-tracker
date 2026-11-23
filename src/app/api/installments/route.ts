import { NextResponse } from "next/server";
import { db } from "@/db";
import { installmentPlans, installmentPlanRevisions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { materializeInstallments, toPlanRevision } from "@/lib/installments-server";
import { MAX_INSTALLMENTS, MIN_INSTALLMENTS, parseIsoDate } from "@/lib/installment-math";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await materializeInstallments(session.user.id);
    const [plans, revisions] = await Promise.all([
      db.select().from(installmentPlans).where(eq(installmentPlans.userId, session.user.id)),
      db.select().from(installmentPlanRevisions).where(eq(installmentPlanRevisions.userId, session.user.id)),
    ]);
    return NextResponse.json(
      plans.map((p) => ({ ...p, revisions: revisions.filter((r) => r.planId === p.id).map(toPlanRevision) }))
    );
  } catch (error) {
    console.error("Installments GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, amount, startDate, totalInstallments } = body;
    const kind: "installment" | "mortgage" = body.kind === "mortgage" ? "mortgage" : "installment";
    // A mortgage is always filed under the Mortgage category.
    const category: unknown = kind === "mortgage" ? "Mortgage" : body.category;

    // Borrowed capital is optional and only meaningful for mortgages.
    let financedAmount: string | null = null;
    if (kind === "mortgage" && body.financedAmount !== undefined && body.financedAmount !== null && body.financedAmount !== "") {
      const parsedFinanced = Number(body.financedAmount);
      if (!Number.isFinite(parsedFinanced) || parsedFinanced <= 0) {
        return NextResponse.json({ error: "Invalid financed amount" }, { status: 400 });
      }
      financedAmount = parsedFinanced.toFixed(2);
    }

    const parsedAmount = Number(amount);
    if (typeof name !== "string" || !name.trim() || name.length > 200) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (typeof category !== "string" || !category) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (typeof startDate !== "string" || !parseIsoDate(startDate)) {
      return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
    }
    if (
      !Number.isInteger(totalInstallments) ||
      totalInstallments < MIN_INSTALLMENTS ||
      totalInstallments > MAX_INSTALLMENTS
    ) {
      return NextResponse.json(
        { error: `Number of installments must be between ${MIN_INSTALLMENTS} and ${MAX_INSTALLMENTS}` },
        { status: 400 }
      );
    }

    const [inserted] = await db
      .insert(installmentPlans)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        name: name.trim(),
        amount: parsedAmount.toFixed(2),
        category,
        startDate,
        totalInstallments,
        kind,
        financedAmount,
      })
      .returning();

    // Records the installments already due (the first one, plus any back-dated
    // ones when the start date is in the past).
    await materializeInstallments(session.user.id);
    const [fresh] = await db.select().from(installmentPlans).where(eq(installmentPlans.id, inserted.id));

    return NextResponse.json({ ...(fresh ?? inserted), revisions: [] });
  } catch (error) {
    console.error("Installments POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
