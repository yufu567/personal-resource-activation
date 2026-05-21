import { NextResponse } from "next/server";
import { z } from "zod";

import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  userId: z.string().optional().default("demo-user"),
  resourceId: z.string(),
  goalId: z.string().optional(),
  outcome: z.enum(["produced-output", "learned", "discarded", "needs-more-work"]).default("learned"),
  actualValue: z.enum(["high", "medium", "low"]).default("medium"),
  reflection: z.string().min(1),
  outputUrl: z.string().url().optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const input = reviewSchema.parse(await request.json());
  const service = getResourceActivationService();
  const review = service.recordReview({
    ...input,
    outputUrl: input.outputUrl || undefined
  });
  return NextResponse.json({
    review,
    snapshot: service.getSnapshot(input.userId)
  });
}
