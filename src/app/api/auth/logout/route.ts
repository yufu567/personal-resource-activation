import { NextResponse } from "next/server";

// Auth.js logout is client-side via signOut().
// This endpoint remains as a simple redirect helper.
export async function POST() {
  return NextResponse.json({ message: "已登出" });
}
