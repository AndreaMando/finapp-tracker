import { NextResponse } from "next/server";
import { db } from "@/db";
import { oneTimeExpenses } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    // Setting up data for update - only include fields that are provided in the request
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.amount !== undefined) updateData.amount = String(body.amount);
    if (body.category) updateData.category = body.category;
    if (body.date) updateData.date = new Date(body.date);
    if (body.monthKey) updateData.monthKey = body.monthKey;

    await db.update(oneTimeExpenses)
      .set(updateData)
      .where(and(eq(oneTimeExpenses.id, params.id), eq(oneTimeExpenses.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error updating" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(oneTimeExpenses).where(
    and(eq(oneTimeExpenses.id, params.id), eq(oneTimeExpenses.userId, session.user.id))
  );

  return NextResponse.json({ success: true });
}
