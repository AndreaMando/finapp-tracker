import { NextResponse } from "next/server";
import { db } from "@/db";
import { installmentPlans } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { materializeInstallments } from "@/lib/installments-server";
import { MAX_INSTALLMENTS, MIN_INSTALLMENTS, parseIsoDate } from "@/lib/installment-math";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await materializeInstallments(session.user.id);
    const data = await db.select().from(installmentPlans).where(eq(installmentPlans.userId, session.user.id));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Installments GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, amount, category, startDate, totalInstallments } = await req.json();

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
      })
      .returning();

    // Records the installments already due (the first one, plus any back-dated
    // ones when the start date is in the past).
    await materializeInstallments(session.user.id);
    const [fresh] = await db.select().from(installmentPlans).where(eq(installmentPlans.id, inserted.id));

    return NextResponse.json(fresh ?? inserted);
  } catch (error) {
    console.error("Installments POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
