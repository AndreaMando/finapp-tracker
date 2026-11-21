import { NextResponse } from "next/server";
import { db } from "@/db";
import { installmentPlans } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// Deleting a plan stops the installments that haven't been recorded yet. The
// ones already recorded stay in the one-time expenses on purpose: that money
// was really spent.
export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db
    .delete(installmentPlans)
    .where(and(eq(installmentPlans.id, params.id), eq(installmentPlans.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
