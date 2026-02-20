import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createUser, getUserByEmail } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, name, password } = await req.json();

  if (!email?.trim() || !name?.trim() || !password?.trim())
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  if (password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const existing = await getUserByEmail(email.toLowerCase());
  if (existing)
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const user = await createUser({
    id: nanoid(),
    email: email.toLowerCase().trim(),
    name: name.trim(),
    password_hash: await hashPassword(password),
  });

  const token = await createSession(user.id);
  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set(setSessionCookie(token));
  return res;
}
