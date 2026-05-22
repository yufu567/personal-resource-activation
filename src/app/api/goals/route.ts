import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/auth/session";
import { getResourceActivationService } from "@/server/resource-activation-service";
import { rateLimit, rateLimitResponse } from "@/server/security";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const goalSchema = z.object({
  resourceIds: z.array(z.string()).min(1),
  intent: z.string().min(1),
});

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  const { limited } = rateLimit(`goals:${userId}`);
  if (limited) return rateLimitResponse();

  const started = Date.now();
  const input = goalSchema.parse(await request.json());
  const service = getResourceActivationService();
  const goal = await service.createGoalFromResources({ ...input, userId });
  const snapshot = await service.getSnapshot(userId);
  logger.info({ method: "POST", path: "/api/goals", userId, duration: Date.now() - started, goal: goal.title, tasks: goal.tasks.length });
  return NextResponse.json({ goal, snapshot });
}
