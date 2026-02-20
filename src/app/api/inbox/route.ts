import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getUserByEmail, getInboxItems, addInboxItem } from "@/lib/db";
import { randomUUID } from "crypto";

function isValidToken(req: NextRequest): boolean {
  const token = process.env.INBOX_API_TOKEN;
  if (!token) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${token}`;
}

// GET — session auth — returns inbox items for the logged-in user
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await getInboxItems(session.userId);
  return NextResponse.json({ items });
}

// POST — API token auth — adds an inbox item for the configured inbox user
export async function POST(req: NextRequest) {
  if (!isValidToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = process.env.INBOX_USER_EMAIL;
  if (!email) return NextResponse.json({ error: "INBOX_USER_EMAIL not configured" }, { status: 500 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: "Inbox user not found" }, { status: 404 });

  const body = await req.json();
  const { content, source = "skill" } = body;
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const item = await addInboxItem({ id: randomUUID(), user_id: user.id, content, source });
  return NextResponse.json({ ok: true, item });
}
