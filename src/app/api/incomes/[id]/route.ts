import { NextResponse } from "next/server";
import { db } from "@/db";
import { incomes } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(incomes).where(
    and(eq(incomes.id, params.id), eq(incomes.userId, session.user.id))
  );

  return NextResponse.json({ success: true });
}
