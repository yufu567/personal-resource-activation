import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SERVICE_NAME = "personal-resource-activation";
const DEFAULT_VERSION = "0.1.0";

function isConfigured(value: string | undefined): "configured" | "missing" {
  return value && value.trim().length > 0 ? "configured" : "missing";
}

function safeLabel(value: string | undefined): string {
  const label = value?.trim();
  if (!label) {
    return "missing";
  }

  return /^[a-z0-9_-]{1,32}$/i.test(label) ? label : "configured";
}

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: SERVICE_NAME,
      time: new Date().toISOString(),
      version: process.env.APP_VERSION?.trim() || process.env.npm_package_version || DEFAULT_VERSION,
      runtime: {
        nodeEnv: safeLabel(process.env.NODE_ENV)
      },
      dependencies: {
        postgres: isConfigured(process.env.DATABASE_URL),
        redis: isConfigured(process.env.REDIS_URL),
        objectStorage: isConfigured(process.env.OBJECT_STORAGE_ENDPOINT),
        aiProvider: safeLabel(process.env.AI_PROVIDER)
      }
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
