import { NextRequest, NextResponse } from "next/server";

const authCookieNames = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url"
];

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/sign-in", request.url));

  for (const name of authCookieNames) {
    response.cookies.set(name, "", {
      expires: new Date(0),
      path: "/"
    });
  }

  return response;
}
