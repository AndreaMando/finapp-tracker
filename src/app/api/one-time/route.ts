import { NextResponse } from "next/server";
import { db } from "@/db";
import { oneTimeExpenses } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await db.select().from(oneTimeExpenses).where(eq(oneTimeExpenses.userId, session.user.id));
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { monthKey, name, amount, category, date } = body;

    if (!monthKey || !name || amount === undefined || !category || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const inserted = await db.insert(oneTimeExpenses).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      monthKey,
      name,
      amount: String(amount),
      category,
      date: new Date(date),
    }).returning();

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error("One-Time Expense API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
