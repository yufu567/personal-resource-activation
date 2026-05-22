import { NextResponse } from "next/server";
import { aiConfigSchema, getAIConfig, setAIConfig } from "@/ai/config";

export async function GET() {
  const config = getAIConfig("demo-user");
  return NextResponse.json({ config });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = aiConfigSchema.parse(body);
    setAIConfig("demo-user", parsed);
    return NextResponse.json({ config: parsed, message: "AI config saved." });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
