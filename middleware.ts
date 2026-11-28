import { NextResponse, type NextRequest } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function middleware(request: NextRequest) {
  // Answer browser preflight requests right away, for every /api route
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  // Add CORS headers to every real /api response, including errors
  const response = NextResponse.next({ request });
  Object.entries(corsHeaders).forEach(([name, value]) => {
    response.headers.set(name, value);
  });
  return response;
}

// Only run on API routes so your pages are untouched
export const config = {
  matcher: "/api/:path*",
};