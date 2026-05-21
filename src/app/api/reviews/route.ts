import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/auth/session";
import { getResourceActivationService } from "@/server/resource-activation-service";

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
  const input = reviewSchema.parse(await request.json());
  const service = getResourceActivationService();
  const review = await service.recordReview({
    ...input,
    userId,
    outputUrl: input.outputUrl || undefined,
  });
  const snapshot = await service.getSnapshot(userId);
  return NextResponse.json({ review, snapshot });
}
