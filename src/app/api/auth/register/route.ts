import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser } from "@/auth/store";
import { setSessionCookie } from "@/auth/session";
import { rateLimit, rateLimitResponse } from "@/server/security";
import { logger } from "@/lib/logger";

const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(4, "密码至少 4 位"),
  displayName: z.string().optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { limited } = rateLimit(`register:${ip}`);
  if (limited) return rateLimitResponse();

  const started = Date.now();
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);
    const user = await createUser(input.email, input.password, input.displayName);
    await setSessionCookie(user.id, user.email);
    logger.info({ event: "register", userId: user.id, duration: Date.now() - started });
    return NextResponse.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "注册失败";
    const status = message === "邮箱已被注册" ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
