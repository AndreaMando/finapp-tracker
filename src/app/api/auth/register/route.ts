import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // --- Validazione Input ---
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // --- Controllo se l'utente esiste già ---
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 } // 409 Conflict
      );
    }

    // --- Hashing della password (MAI salvare password in chiaro) ---
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- Inserimento nuovo utente nel DB ---
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