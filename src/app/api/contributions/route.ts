import { NextResponse } from "next/server";
import { db } from "@/db";
import { goalContributions } from "@/db/schema";
import { withCors, handleOptions } from "@/lib/cors";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  const data = await db.select().from(goalContributions);
  return withCors(NextResponse.json(data));
}

export async function POST(req: Request) {
  const entry = await req.json();
  await db.insert(goalContributions).values(entry);
  return withCors(NextResponse.json(entry));
}
