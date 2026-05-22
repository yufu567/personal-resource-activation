import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUserId } from "@/auth/session";
import { ResearchEngine } from "@/ai/research-engine";
import { createAIProvider } from "@/ai/factory";
import { createSearXNGProvider } from "@/connectors/search/searxng";
import { rateLimit, rateLimitResponse } from "@/server/security";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/sentry-helper";
import { getResourceActivationService } from "@/server/resource-activation-service";

export const dynamic = "force-dynamic";

const researchSchema = z.object({
  questions: z.array(
    z.object({
      query: z.string().min(1),
      purpose: z.string(),
      expectedType: z.string().default(""),
    }),
  ),
});

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  const { limited } = rateLimit(`research:${userId}`);
  if (limited) return rateLimitResponse();

  const started = Date.now();
  try {
    const body = await request.json();
    const input = researchSchema.parse(body);

    // Layer 1 & 2: User resources + AI knowledge
    const service = getResourceActivationService();
    const snapshot = await service.getSnapshot(userId);

    // Layer 3: SearXNG (optional — only used if AI marks low confidence)
    const searxngEndpoint = process.env.SEARXNG_ENDPOINT;
    const webSearch = searxngEndpoint ? createSearXNGProvider({ endpoint: searxngEndpoint }) : undefined;

    const aiProvider = createAIProvider();
    const engine = new ResearchEngine(aiProvider, webSearch);

    const mappedQuestions = input.questions.map((q) => ({
      query: q.query,
      purpose: q.purpose,
      expectedType: q.expectedType ?? "",
    }));

    const output = await engine.research(
      mappedQuestions,
      snapshot.resources,
      snapshot.analyses,
    );

    logger.info({
      event: "research_completed",
      userId,
      questions: input.questions.length,
      findings: output.findings.length,
      unresolved: output.unresolvedGaps.length,
      webSearches: output.webSearchCount,
      duration: Date.now() - started,
    });

    return NextResponse.json(output);
  } catch (error) {
    captureException(error, { userId, path: "/api/research" });
    const message = error instanceof Error ? error.message : "调研失败";
    logger.error({ event: "research_failed", userId, error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
