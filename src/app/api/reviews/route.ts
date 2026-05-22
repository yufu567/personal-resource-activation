import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/auth/session";
import { getResourceActivationService } from "@/server/resource-activation-service";
import { rateLimit, rateLimitResponse } from "@/server/security";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/sentry-helper";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  resourceId: z.string(),
  goalId: z.string().optional(),
  outcome: z.enum(["produced-output", "learned", "discarded", "needs-more-work"]).default("learned"),
  actualValue: z.enum(["high", "medium", "low"]).default("medium"),
  reflection: z.string().min(1),
  outputUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  const { limited } = rateLimit(`reviews:${userId}`);
  if (limited) return rateLimitResponse();

  const started = Date.now();
  try {
    const input = reviewSchema.parse(await request.json());
    const service = getResourceActivationService();
    const review = await service.recordReview({
      ...input,
      userId,
      outputUrl: input.outputUrl || undefined,
    });
    const snapshot = await service.getSnapshot(userId);
    logger.info({ method: "POST", path: "/api/reviews", userId, duration: Date.now() - started, outcome: review.outcome, valueDelta: review.valueDelta });
    return NextResponse.json({ review, snapshot });
  } catch (error) {
    captureException(error, { userId, path: "/api/reviews" });
    logger.error({ method: "POST", path: "/api/reviews", userId, error: String(error) });
    return NextResponse.json({ error: "复盘失败" }, { status: 500 });
  }
}
