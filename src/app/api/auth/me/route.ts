import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.name ?? session.user.email?.split("@")[0],
    },
  });
}
