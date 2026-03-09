import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin route protection (except login page)
  if (
    pathname.startsWith("/admin/") &&
    pathname !== "/admin"
  ) {
    const session = request.cookies.get("admin_session");
    if (!session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Invalid play token — basic format check
  if (pathname.startsWith("/play/")) {
    const parts = pathname.split("/");
    const token = parts[2];
    if (!token || token.length < 10) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path+", "/play/:path*"],
};
