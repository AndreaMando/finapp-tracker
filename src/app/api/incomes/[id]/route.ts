import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { incomes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withCors, handleOptions } from "@/lib/cors";

export async function OPTIONS() {
  return handleOptions();
}

export async function DELETE(req: NextRequest, context: any) {
  const { id } = await context.params;
  await db.delete(incomes).where(eq(incomes.id, id));
  return withCors(new NextResponse(null, { status: 204 }));
}

// optionally support PUT if we ever need to update incomes
export async function PUT(req: NextRequest, context: any) {
  const { id } = await context.params;
  const updates = await req.json();
  await db
    .update(incomes)
    .set(updates)
    .where(eq(incomes.id, id));
  return withCors(new NextResponse(null, { status: 204 }));
}
