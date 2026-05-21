import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/auth/session";
import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

const goalSchema = z.object({
  resourceIds: z.array(z.string()).min(1),
  intent: z.string().min(1),
});

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  const input = goalSchema.parse(await request.json());
  const service = getResourceActivationService();
  const goal = await service.createGoalFromResources({ ...input, userId });
  const snapshot = await service.getSnapshot(userId);
  return NextResponse.json({ goal, snapshot });
}
