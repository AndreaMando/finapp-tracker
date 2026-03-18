import { NextResponse } from "next/server";
import { db } from "@/db";
import { goalContributions, savingsGoals } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get contrib first to verify ownership via goal (indirectly) or if simpler just trust ID but verifying is better
    const contrib = await db.query.goalContributions.findFirst({
        where: eq(goalContributions.id, params.id),
        with: {
            goal: true
        }
    });

    if (!contrib || contrib.goal.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.delete(goalContributions).where(eq(goalContributions.id, params.id));
    
    await db.update(savingsGoals)
            .set({ currentAmount: sql`${savingsGoals.currentAmount} - ${contrib.amount}` })
            .where(eq(savingsGoals.id, contrib.goalId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
