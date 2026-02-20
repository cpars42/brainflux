import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

const PUBLIC = ["/login", "/register", "/api/auth/login", "/api/auth/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return NextResponse.next();

  const token = req.cookies.get("bf_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  const session = await verifySession(token);
  if (!session) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("bf_session");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
