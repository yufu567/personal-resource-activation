import { NextResponse } from "next/server";
import { z } from "zod";
import { validateLogin, seedDemoUser } from "@/auth/store";
import { setSessionCookie } from "@/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "请输入密码"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);

    // Auto-seed demo user so the existing demo data is accessible
    await seedDemoUser();

    const user = await validateLogin(input.email, input.password);
    if (!user) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }
    await setSessionCookie(user.id, user.email);
    return NextResponse.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "登录失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
