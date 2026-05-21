import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/auth/session";
import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

const resourceSchema = z.object({
  source: z.enum(["github", "x", "upload", "link", "drive"]).default("link"),
  title: z.string().min(1),
  url: z.string().url().optional().or(z.literal("")),
  content: z.string().optional(),
  collectionPath: z.string().optional(),
});

export async function GET() {
  const userId = await getCurrentUserId();
  const service = getResourceActivationService();
  const snapshot = await service.seedDemo(userId);
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  const body = await request.json();
  const input = resourceSchema.parse(body);
  const service = getResourceActivationService();
  const result = await service.addResource({
    ...input,
    userId,
    url: input.url || undefined,
  });
  const snapshot = await service.getSnapshot(userId);
  return NextResponse.json({ ...result, snapshot });
}
