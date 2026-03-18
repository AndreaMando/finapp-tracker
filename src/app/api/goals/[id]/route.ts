import { NextResponse } from "next/server";
import { db } from "@/db";
import { savingsGoals } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(savingsGoals).where(
    and(eq(savingsGoals.id, params.id), eq(savingsGoals.userId, session.user.id))
  );

  return NextResponse.json({ success: true });
}

// PUT endpoint to update the currentAmount of a savings goal
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
    try {
      const body = await req.json();
      const updateData: any = {};
      // allow updating fields
      if (body.currentAmount !== undefined) updateData.currentAmount = String(body.currentAmount);
      
      await db.update(savingsGoals)
        .set(updateData)
        .where(and(eq(savingsGoals.id, params.id), eq(savingsGoals.userId, session.user.id)));
  
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: "Error updating" }, { status: 500 });
    }
}
