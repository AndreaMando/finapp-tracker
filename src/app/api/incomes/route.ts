import { NextResponse } from "next/server";
import { db } from "@/db";
import { incomes } from "@/db/schema";
import { withCors, handleOptions } from "@/lib/cors";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  const data = await db.select().from(incomes);
  return withCors(NextResponse.json(data));
}

export async function POST(req: Request) {
  const entry = await req.json();
  await db.insert(incomes).values(entry);
  return withCors(NextResponse.json(entry));
}
