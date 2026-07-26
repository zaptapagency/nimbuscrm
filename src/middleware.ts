import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getStrictRateLimitConfig } from "@/lib/rateLimit";

// Paths that need stricter rate limiting
const STRICT_PATHS = ["/api/auth/signin", "/api/signup"];

export function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip health check
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  // Get client IP
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  // Determine which rate limit config to use
  const isStrictPath = STRICT_PATHS.some((path) => request.nextUrl.pathname.includes(path));
  const config = isStrictPath ? getStrictRateLimitConfig() : undefined;

  // Check rate limit
  const { allowed, remaining } = checkRateLimit(ip, config);

  if (!allowed) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-RateLimit-Limit": config?.maxRequests.toString() || "60",
        "X-RateLimit-Remaining": "0",
      },
    });
  }

  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", config?.maxRequests.toString() || "60");
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
