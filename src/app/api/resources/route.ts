import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/auth/session";
import { getResourceActivationService } from "@/server/resource-activation-service";
import { rateLimit, rateLimitResponse } from "@/server/security";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/sentry-helper";

export const dynamic = "force-dynamic";

const resourceSchema = z.object({
  source: z.enum(["github", "x", "upload", "link", "drive"]).default("link"),
  title: z.string().min(1),
  url: z.string().url().optional().or(z.literal("")),
  content: z.string().optional(),
  collectionPath: z.string().optional(),
});

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  const { limited } = rateLimit(`resources_get:${userId}`);
  if (limited) return rateLimitResponse();

  const started = Date.now();
  const service = getResourceActivationService();
  const snapshot = await service.seedDemo(userId);
  logger.info({ method: "GET", path: "/api/resources", userId, duration: Date.now() - started, resources: snapshot.metrics.totalResources });
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  const { limited } = rateLimit(`resources_post:${userId}`);
  if (limited) return rateLimitResponse();

  const started = Date.now();
  try {
    const body = await request.json();
    const input = resourceSchema.parse(body);
    const service = getResourceActivationService();
    const result = await service.addResource({
      ...input,
      userId,
      url: input.url || undefined,
    });
    const snapshot = await service.getSnapshot(userId);
    logger.info({ method: "POST", path: "/api/resources", userId, duration: Date.now() - started, resource: result.resource.title });
    return NextResponse.json({ ...result, snapshot });
  } catch (error) {
    captureException(error, { userId, path: "/api/resources" });
    logger.error({ method: "POST", path: "/api/resources", userId, error: String(error) });
    return NextResponse.json({ error: "添加资源失败" }, { status: 500 });
  }
}
