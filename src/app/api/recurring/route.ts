import { NextResponse } from "next/server";
import { db } from "@/db";
import { recurringExpenses, recurringExpenseAmounts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const monthKey = url.searchParams.get("monthKey");

    const data = await db.select().from(recurringExpenses).where(eq(recurringExpenses.userId, session.user.id));

    if (!monthKey) return NextResponse.json(data);

    // load all amount history for the user and pick the latest effective entry per recurring
    let amounts: any[] = [];
    try {
      amounts = await db.select().from(recurringExpenseAmounts).where(eq(recurringExpenseAmounts.userId, session.user.id));
    } catch (err) {
      // If the history table doesn't exist yet, proceed without history (fallback to base recurring amount)
      console.warn("Recurring GET: could not load amount history, proceeding without it.", err);
      amounts = [];
    }
    const map = amounts.reduce<Record<string, any[]>>((acc, a) => {
      (acc[a.recurringId] = acc[a.recurringId] || []).push(a);
      return acc;
    }, {});

    const mapped = data.map((r) => {
      const list = (map[r.id] || []).filter((a) => a.effectiveMonth <= monthKey);
      if (list.length > 0) {
        list.sort((x, y) => {
          if (x.effectiveMonth === y.effectiveMonth) return new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime();
          return y.effectiveMonth.localeCompare(x.effectiveMonth);
        });
        return { ...r, amount: list[0].amount };
      }
      return r;
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Recurring GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, amount, category, startMonth } = body;

    const inserted = await db.insert(recurringExpenses).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name,
      amount: String(amount),
      category,
      active: true,
      startMonth,
    }).returning();

    // create initial amount history for this recurring expense
    try {
      await db.insert(recurringExpenseAmounts).values({
        id: crypto.randomUUID(),
        recurringId: inserted[0].id,
        amount: String(amount),
        effectiveMonth: startMonth,
        userId: session.user.id,
      });
    } catch (err) {
      console.error("Failed to insert recurring amount history:", err);
    }

    return NextResponse.json(inserted[0]);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
