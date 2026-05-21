import { describe, expect, test, vi } from "vitest";

import { GET } from "@/app/api/health/route";

describe("health route", () => {
  test("returns public app health metadata without leaking secrets", async () => {
    vi.stubEnv("APP_VERSION", "9.8.7-test");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://user:super-secret-db-password@postgres:5432/app");
    vi.stubEnv("REDIS_URL", "redis://:super-secret-redis-password@redis:6379");
    vi.stubEnv("OBJECT_STORAGE_ENDPOINT", "https://storage.example.com");
    vi.stubEnv("OBJECT_STORAGE_ACCESS_KEY_ID", "super-secret-access-key");
    vi.stubEnv("OBJECT_STORAGE_SECRET_ACCESS_KEY", "super-secret-storage-key");
    vi.stubEnv("AI_PROVIDER", "mock");

    const response = await GET();
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      status: "ok",
      service: "personal-resource-activation",
      version: "9.8.7-test",
      runtime: {
        nodeEnv: "production"
      },
      dependencies: {
        postgres: "configured",
        redis: "configured",
        objectStorage: "configured",
        aiProvider: "mock"
      }
    });
    expect(new Date(body.time).toString()).not.toBe("Invalid Date");
    expect(serialized).not.toContain("super-secret");
    expect(serialized).not.toContain("postgresql://");
    expect(serialized).not.toContain("redis://");
  });
});
