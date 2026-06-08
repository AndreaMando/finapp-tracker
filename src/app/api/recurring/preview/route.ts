import { NextResponse } from "next/server";
import { db } from "@/db";
import { recurringExpenses, recurringExpenseAmounts, oneTimeExpenses } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const monthKey = url.searchParams.get("monthKey");
    if (!monthKey) return NextResponse.json({ error: "monthKey required" }, { status: 400 });

    const recurrings = await db.select().from(recurringExpenses).where(eq(recurringExpenses.userId, session.user.id));

    // load amount history if present
    let amounts: any[] = [];
    try {
      amounts = await db.select().from(recurringExpenseAmounts).where(eq(recurringExpenseAmounts.userId, session.user.id));
    } catch (err) {
      amounts = [];
    }
    const map = amounts.reduce<Record<string, any[]>>((acc, a) => { (acc[a.recurringId] = acc[a.recurringId] || []).push(a); return acc; }, {});

    // load already applied one-time expenses for the month
    let applied: any[] = [];
    try {
      applied = await db.select().from(oneTimeExpenses).where(
        and(eq(oneTimeExpenses.userId, session.user.id), eq(oneTimeExpenses.monthKey, monthKey))
      );
    } catch (err) {
      applied = [];
    }
    const appliedSet = new Set((applied || []).map((a) => a.sourceRecurringId).filter(Boolean));

    const preview = recurrings
      .filter((r) => r.startMonth <= monthKey && (!r.endMonth || r.endMonth >= monthKey))
      .map((r) => {
        const list = (map[r.id] || []).filter((a) => a.effectiveMonth <= monthKey);
        let amount = r.amount;
        if (list.length > 0) {
          list.sort((x, y) => {
            if (x.effectiveMonth === y.effectiveMonth) return new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime();
            return y.effectiveMonth.localeCompare(x.effectiveMonth);
          });
          amount = list[0].amount;
        }
        return {
          id: r.id,
          name: r.name,
          category: r.category,
          amount: Number(amount),
          isApplied: appliedSet.has(r.id),
        };
      });

    return NextResponse.json(preview);
  } catch (error) {
    console.error("Recurring preview error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
