import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { savingsGoals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withCors, handleOptions } from "@/lib/cors";

export async function OPTIONS() {
  return handleOptions();
}

export async function PUT(req: NextRequest, context: any) {
  const { id } = await context.params;
  const updates = await req.json();
  await db
    .update(savingsGoals)
    .set(updates)
    .where(eq(savingsGoals.id, id));
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function DELETE(req: NextRequest, context: any) {
  const { id } = await context.params;
  await db.delete(savingsGoals).where(eq(savingsGoals.id, id));
  return withCors(new NextResponse(null, { status: 204 }));
}
