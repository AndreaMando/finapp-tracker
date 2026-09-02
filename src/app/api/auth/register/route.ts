import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The password-strength rules (8+ chars, uppercase, number, special char)
// were previously only enforced in register/page.tsx — a direct call to
// this API could create an account with a trivially weak password. Mirror
// the same rules here so the client-side UI isn't the only gate.
function passwordIsStrongEnough(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

// Best-effort in-memory rate limit for this public, unauthenticated endpoint.
// It only throttles per-serverless-instance (a real multi-instance deployment
// needs a shared store like Upstash/Redis for this to be robust), but it's a
// meaningful deterrent against naive scripted signup spam with zero added
// infra, and costs nothing when the limit isn't hit.
const RATE_LIMIT = 5; // registrations
const RATE_WINDOW_MS = 60 * 60 * 1000; // per hour, per IP
const attempts = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (attempts.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  attempts.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { name, email, password } = await request.json();

    // Input validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (!passwordIsStrongEnough(password)) {
      return NextResponse.json(
        { error: "Password does not meet the minimum requirements." },
        { status: 400 }
      );
    }

    // Check if user with the same email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 } // 409 Conflict
      );
    }

    // Password hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    // New user creation in the database
    const newUser = await db
      .insert(users)
      .values({
        name: name,
        email: email,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
      });

    return NextResponse.json({ user: newUser[0] }, { status: 201 });
  } catch (error) {
    console.error("Errore durante la registrazione:", error);
    return NextResponse.json(
      { error: "An internal error occurred." },
      { status: 500 }
    );
  }
}