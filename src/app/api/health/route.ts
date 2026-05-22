import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SERVICE_NAME = "personal-resource-activation";
const DEFAULT_VERSION = "0.1.0";

// ── Sentry (zero-dependency, HTTP API) ──

let sentryReady = false;

function initSentry() {
  if (sentryReady) return;
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  sentryReady = true;
  console.log("[sentry] Initialized");
}

function sendSentryError(message: string) {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  try {
    const m = dsn.match(/^https?:\/\/([^@]+)@([^/]+)\/(\d+)$/);
    if (!m) return;
    const [, key, host, projectId] = m;
    const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    fetch(`https://${host}/api/${projectId}/store/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${key}`,
      },
      body: JSON.stringify({
        event_id: id,
        timestamp: new Date().toISOString(),
        level: "error",
        environment: "production",
        exception: { values: [{ type: "Error", value: message }] },
      }),
    }).catch(() => {});
  } catch {}
}

initSentry();

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

export async function GET(request: Request) {
  const url = request.url;
  // Test Sentry
  if (url.includes("test_sentry")) {
    sendSentryError("Test error from personal-resource-activation");
    return NextResponse.json({ sentry: "test_error_sent" });
  }
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
        searxng: isConfigured(process.env.SEARXNG_ENDPOINT),
        aiProvider: safeLabel(process.env.AI_PROVIDER),
      }
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
