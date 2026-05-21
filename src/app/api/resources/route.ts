import { NextResponse } from "next/server";
import { z } from "zod";

import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

const resourceSchema = z.object({
  userId: z.string().optional().default("demo-user"),
  source: z.enum(["github", "x", "upload", "link", "drive"]).default("link"),
  title: z.string().min(1),
  url: z.string().url().optional().or(z.literal("")),
  content: z.string().optional(),
  collectionPath: z.string().optional()
});

export async function GET() {
  const service = getResourceActivationService();
  const snapshot = await service.seedDemo("demo-user");
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const body = await request.json();
  const input = resourceSchema.parse(body);
  const service = getResourceActivationService();
  const result = await service.addResource({
    ...input,
    url: input.url || undefined
  });
  return NextResponse.json({
    ...result,
    snapshot: service.getSnapshot(input.userId)
  });
}
