import { NextResponse } from "next/server";
import { db } from "@/db";
import { goalContributions, savingsGoals } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userGoals = await db.query.savingsGoals.findMany({
    where: eq(savingsGoals.userId, session.user.id),
    with: {
        contributions: true
    }
  });
  
  const allContributions = userGoals.flatMap(g => g.contributions);
  return NextResponse.json(allContributions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { goalId, monthKey, amount, note } = body;

    // Verify ownership of goal
    const goal = await db.query.savingsGoals.findFirst({
        where: eq(savingsGoals.id, goalId)
    });

    if (!goal || goal.userId !== session.user.id) {
        return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const [contrib] = await db.insert(goalContributions).values({
        id: crypto.randomUUID(),
        goalId,
        monthKey,
        amount: String(amount),
        note: note || "",
    }).returning();

    // Update goal total
    await db.update(savingsGoals)
        .set({ currentAmount: sql`${savingsGoals.currentAmount} + ${String(amount)}` })
        .where(eq(savingsGoals.id, goalId));

    return NextResponse.json(contrib);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
