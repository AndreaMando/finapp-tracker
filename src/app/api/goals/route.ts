import { NextResponse } from "next/server";
import { db } from "@/db";
import { savingsGoals } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await db.select().from(savingsGoals).where(eq(savingsGoals.userId, session.user.id));
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, targetAmount, deadline, color } = body;

    const inserted = await db.insert(savingsGoals).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name,
      targetAmount: String(targetAmount),
      currentAmount: "0",
      deadline: new Date(deadline),
      color,
    }).returning();

    return NextResponse.json(inserted[0]);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
