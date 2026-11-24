import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Authenticated pages enforce access in their server-side checks. Keep public
  // recovery and sign-in routes available to signed-out users.
  return NextResponse.next({ request });
}
