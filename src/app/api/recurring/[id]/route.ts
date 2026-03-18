import { NextResponse } from "next/server";
import { db } from "@/db";
import { recurringExpenses } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.amount !== undefined) updateData.amount = String(body.amount);
    if (body.active !== undefined) updateData.active = body.active;
    // Add other fields as needed

    await db.update(recurringExpenses)
      .set(updateData)
      .where(and(eq(recurringExpenses.id, params.id), eq(recurringExpenses.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error updating" }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(recurringExpenses).where(
    and(eq(recurringExpenses.id, params.id), eq(recurringExpenses.userId, session.user.id))
  );

  return NextResponse.json({ success: true });
}
