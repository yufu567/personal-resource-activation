/**
 * Zero-dependency Sentry error reporter.
 * Posts errors to Sentry's HTTP API directly — no SDK required.
 */

interface SentryConfig {
  dsn: string;
}

interface SentryEvent {
  event_id: string;
  timestamp: string;
  level: "error" | "warning" | "info";
  exception?: { values: Array<{ type: string; value: string; stacktrace?: { frames: Array<{ filename: string; function: string; lineno: number }> } }> };
  message?: string;
  environment?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

function parseDsn(dsn: string): { key: string; host: string; projectId: string } | null {
  const m = dsn.match(/^https?:\/\/([^@]+)@([^/]+)\/(\d+)$/);
  if (!m) return null;
  const [, key, host, projectId] = m;
  return { key, host, projectId };
}

function generateId(): string {
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let config: SentryConfig | null = null;

export function initSentry() {
  if (typeof window !== "undefined") return;
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  config = { dsn };
  console.log("[sentry] Initialized (lightweight, zero-dependency)");
}

export function captureException(error: unknown, extra?: Record<string, unknown>) {
  if (!config) return;
  const parsed = parseDsn(config.dsn);
  if (!parsed) return;

  const event: SentryEvent = {
    event_id: generateId(),
    timestamp: new Date().toISOString(),
    level: "error",
    environment: process.env.NODE_ENV ?? "production",
    exception: {
      values: [
        {
          type: error instanceof Error ? error.constructor.name : "Error",
          value: error instanceof Error ? error.message : String(error),
        },
      ],
    },
    extra: extra ?? {},
  };

  sendEvent(parsed, event);
}

async function sendEvent(
  parsed: { key: string; host: string; projectId: string },
  event: SentryEvent,
) {
  try {
    const url = `https://${parsed.host}/api/${parsed.projectId}/store/`;
    const auth = `Sentry sentry_version=7, sentry_key=${parsed.key}`;

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": auth,
      },
      body: JSON.stringify(event),
    });
  } catch {
    // Silently fail — don't let Sentry reporting break the app
  }
}
