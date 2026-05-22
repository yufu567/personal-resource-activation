/**
 * Security utilities for API routes.
 *
 * Rate limiting is a simple in-memory implementation suitable for single-server
 * deployments. For multi-server deployments, use Redis-based rate limiting.
 */

import { NextResponse } from "next/server";

// ── Rate Limiting ──

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60; // per window

export function rateLimit(key: string): { limited: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, remaining: MAX_REQUESTS - 1 };
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return { limited: true, remaining: 0 };
  }

  return { limited: false, remaining: MAX_REQUESTS - entry.count };
}

export function rateLimitResponse() {
  return NextResponse.json(
    { error: "请求过于频繁，请稍后再试" },
    {
      status: 429,
      headers: { "Retry-After": "60" },
    },
  );
}

// Clean up stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}, 300_000); // every 5 minutes

// ── Security Headers ──

export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
} as const;

export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}
