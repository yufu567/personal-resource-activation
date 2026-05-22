import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, rateLimitResponse } from "@/server/security";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/sentry-helper";

// Auth.js handles login via signIn("credentials", ...).
// This legacy endpoint remains for rate limiting and logging only.
// It does NOT set a session cookie — Auth.js manages sessions.

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "请输入密码"),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { limited } = rateLimit(`login:${ip}`);
  if (limited) return rateLimitResponse();

  const started = Date.now();
  try {
    const body = await request.json();
    loginSchema.parse(body);
    logger.info({ event: "login_attempt", ip, duration: Date.now() - started });
    // Auth.js Credentials provider handles actual login
    return NextResponse.json({ message: "Use Auth.js signIn for session" });
  } catch (error) {
    captureException(error, { path: "/api/auth/login" });
    const message = error instanceof Error ? error.message : "登录失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
