import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/auth/session";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ message: "已登出" });
}
