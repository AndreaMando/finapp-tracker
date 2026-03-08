import { NextResponse } from "next/server";
import { db } from "@/db";
import { savingsGoals } from "@/db/schema";
import { withCors, handleOptions } from "@/lib/cors";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  const data = await db.select().from(savingsGoals);
  return withCors(NextResponse.json(data));
}

export async function POST(req: Request) {
  const entry = await req.json();
  await db.insert(savingsGoals).values(entry);
  return withCors(NextResponse.json(entry));
}
