import { NextResponse } from "next/server";
import { db } from "@/db";
import { incomes } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await db.select().from(incomes).where(eq(incomes.userId, session.user.id));
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { monthKey, amount, note } = body;

    if (!monthKey || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if income exists for this month
    const existing = await db.query.incomes.findFirst({
      where: and(eq(incomes.userId, session.user.id), eq(incomes.monthKey, monthKey))
    });

    if (existing) {
      // Update
      const updated = await db.update(incomes)
        .set({ amount: String(amount), note: note || "" })
        .where(eq(incomes.id, existing.id))
        .returning();
      return NextResponse.json(updated[0]);
    } else {
      // Insert
      const inserted = await db.insert(incomes).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        monthKey,
        amount: String(amount),
        note: note || "",
      }).returning();
      return NextResponse.json(inserted[0]);
    }
  } catch (error) {
    console.error("Income API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
