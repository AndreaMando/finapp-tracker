import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { oneTimeExpenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withCors, handleOptions } from "@/lib/cors";

export async function OPTIONS() {
  return handleOptions();
}

export async function PUT(req: NextRequest, context: any) {
  const { id } = await context.params;
  const updates = await req.json();
  if ("active" in updates) {
    // ensure numeric value for SQLite
    updates.active = updates.active ? 1 : 0;
  }
  await db
    .update(oneTimeExpenses)
    .set(updates)
    .where(eq(oneTimeExpenses.id, id));
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function DELETE(req: NextRequest, context: any) {
  const { id } = await context.params;
  await db.delete(oneTimeExpenses).where(eq(oneTimeExpenses.id, id));
  return withCors(new NextResponse(null, { status: 204 }));
}
