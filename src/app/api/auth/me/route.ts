import { NextResponse } from "next/server";
import { getSession } from "@/auth/session";
import { getUserById } from "@/auth/store";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const user = getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: { id: user.id, email: user.email, displayName: user.displayName },
  });
}
