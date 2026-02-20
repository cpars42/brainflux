import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email?.trim() || !password?.trim())
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });

  const user = await getUserByEmail(email.toLowerCase());
  if (!user)
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid)
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const token = await createSession(user.id);
  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set(setSessionCookie(token));
  return res;
}
