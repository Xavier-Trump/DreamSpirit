import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/dreams/:path*", "/insights/:path*", "/community/:path*", "/settings/:path*"]
};
