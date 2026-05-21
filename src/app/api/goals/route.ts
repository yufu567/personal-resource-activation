import { NextResponse } from "next/server";
import { z } from "zod";

import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

const goalSchema = z.object({
  userId: z.string().optional().default("demo-user"),
  resourceIds: z.array(z.string()).min(1),
  intent: z.string().min(1)
});

export async function POST(request: Request) {
  const input = goalSchema.parse(await request.json());
  const service = getResourceActivationService();
  const goal = await service.createGoalFromResources(input);
  return NextResponse.json({
    goal,
    snapshot: service.getSnapshot(input.userId)
  });
}
