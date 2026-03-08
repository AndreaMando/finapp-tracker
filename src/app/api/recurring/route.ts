import { NextResponse } from "next/server";
import { db } from "@/db";
import { recurringExpenses } from "@/db/schema";
import { withCors, handleOptions } from "@/lib/cors";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  const data = await db.select().from(recurringExpenses);
  return withCors(NextResponse.json(data));
}

export async function POST(req: Request) {
  const entry = await req.json();
  if ("active" in entry) {
    entry.active = entry.active ? 1 : 0;
  }
  await db.insert(recurringExpenses).values(entry);
  return withCors(NextResponse.json(entry));
}
