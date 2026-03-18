import { NextResponse } from "next/server";
import { db } from "@/db";
import { recurringExpenses } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await db.select().from(recurringExpenses).where(eq(recurringExpenses.userId, session.user.id));
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, amount, category, startMonth } = body;

    const inserted = await db.insert(recurringExpenses).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name,
      amount: String(amount),
      category,
      active: true,
      startMonth,
    }).returning();

    return NextResponse.json(inserted[0]);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
