import { NextResponse } from "next/server";
import { db } from "@/db";
import { recurringExpenses, recurringExpenseAmounts, oneTimeExpenses } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { monthKey, items } = body;
    if (!monthKey || !Array.isArray(items)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    // load recurrings map
    const ids = items.map((i: any) => i.id);
    const recurrings = await db.select().from(recurringExpenses)
      .where(and(eq(recurringExpenses.userId, session.user.id), inArray(recurringExpenses.id, ids)));

    // load amount histories
    let amounts: any[] = [];
    try {
      amounts = await db.select().from(recurringExpenseAmounts).where(eq(recurringExpenseAmounts.userId, session.user.id));
    } catch (err) {
      amounts = [];
    }
    const amtMap = amounts.reduce<Record<string, any[]>>((acc, a) => { (acc[a.recurringId] = acc[a.recurringId] || []).push(a); return acc; }, {});

    const created: any[] = [];
    const userId = session.user.id;

    // neon-http driver doesn't support transactions; perform idempotent sequential inserts
    for (const it of items) {
      const id: string = it.id;
      const overrideAmount = typeof it.amount === "number" ? it.amount : undefined;
      const r = recurrings.find((x: any) => x.id === id);
      if (!r) continue;

      // idempotency: skip if already exists
      const exists = await db.select().from(oneTimeExpenses).where(and(eq(oneTimeExpenses.sourceRecurringId, id), eq(oneTimeExpenses.monthKey, monthKey))).limit(1);
      if (exists.length > 0) continue;

      // resolve amount
      let amount = Number(r.amount);
      const list = (amtMap[r.id] || []).filter((a) => a.effectiveMonth <= monthKey);
      if (list.length > 0) {
        list.sort((x, y) => {
          if (x.effectiveMonth === y.effectiveMonth) return new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime();
          return y.effectiveMonth.localeCompare(x.effectiveMonth);
        });
        amount = Number(list[0].amount);
      }
      if (overrideAmount !== undefined) amount = overrideAmount;

      const dateIso = new Date(`${monthKey}-01`);

      const ins = await db.insert(oneTimeExpenses).values({
        id: crypto.randomUUID(),
        monthKey,
        name: r.name,
        amount: String(amount),
        category: r.category,
        date: dateIso,
        userId,
        sourceRecurringId: id,
      } as any).returning();

      created.push(ins[0]);
    }

    return NextResponse.json({ created });
  } catch (error) {
    console.error("Recurring apply error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
